/**
 * @file core/agent/generateProject.ts
 * @description Top-level use-case: Generate a project from a user prompt.
 *
 * This is the main entry point for the AI code generation workflow.
 * It orchestrates the full lifecycle:
 *   1. Create a sandbox
 *   2. Build agent tools
 *   3. Run the AI agent loop
 *   4. Classify the result (success / incomplete / error)
 *   5. Persist the result to the database
 *
 * This module is PURE business logic — no external provider imports.
 * All I/O happens through injected dependencies.
 */

import type {
  GenerateProjectInput,
  GenerateProjectResult,
  CodeAgentState,
  AgentDependencies,
} from "./types";
import type { AIProvider, AIModelConfig } from "@/services/ai";
import { buildAgentTools, detectSummary } from "./aiLoop";
import { AGENT_SYSTEM_PROMPT } from "./system-prompt";
import {
  classifyAIError,
  isIncompleteResult,
  getIncompleteResultMessage,
} from "./helpers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The E2B sandbox template to use. */
const SANDBOX_TEMPLATE = "codeflux-nextjs-test-2-modified";

/** Maximum AI agent loop iterations (safety cap). */
const MAX_ITERATIONS = 30;

/** Port the sandbox dev server runs on. */
const PREVIEW_PORT = 3000;

// ---------------------------------------------------------------------------
// Main Use-Case
// ---------------------------------------------------------------------------

/**
 * Generate a project from a user prompt.
 *
 * This is called by the queue handler (Inngest, SQS, etc.) after a job
 * is dequeued. It contains ALL the orchestration logic — the queue
 * implementation is just a thin trigger.
 *
 * @param input       - The prompt and project ID.
 * @param aiProvider  - The AI provider implementation.
 * @param aiConfig    - Model configuration.
 * @param deps        - Injected sandbox + database dependencies.
 * @returns The generation result, or an error object.
 */
export async function generateProject(
  input: GenerateProjectInput,
  aiProvider: AIProvider,
  aiConfig: AIModelConfig,
  deps: AgentDependencies,
): Promise<GenerateProjectResult | { error: string }> {
  // -----------------------------------------------------------------------
  // Step 1: Acquire a sandbox (reconnect existing or create first-time)
  // -----------------------------------------------------------------------
  // Strategy:
  //   - If the project already has a sandboxId → try reconnecting.
  //     - Alive  → reuse it (zero cost, fast).
  //     - Dead   → notify user and STOP. Do NOT create a new sandbox
  //                silently — let the user decide whether to proceed.
  //   - If no sandboxId exists → this is the first run for this project,
  //     so creating a sandbox is expected (user explicitly triggered it).
  // -----------------------------------------------------------------------
  let sandboxId: string;

  const existingSandboxId = await deps.getProjectSandboxId(input.projectId);

  if (existingSandboxId) {
    // ── Try reconnecting to existing sandbox ──────────────────────────
    const alive = await deps.isSandboxAlive(existingSandboxId);

    if (alive) {
      sandboxId = existingSandboxId;
      console.log(
        `[CodeFlux] Reusing existing sandbox ${sandboxId} for project ${input.projectId}`,
      );
    } else {
      // Sandbox expired — clear the stale reference
      console.log(
        `[CodeFlux] Sandbox ${existingSandboxId} expired for project ${input.projectId}`,
      );
      await deps.clearProjectSandbox(input.projectId);

      // Notify the user instead of silently creating a new sandbox
      const userFacingMessage =
        "⚠️ Your previous sandbox has expired. Please send your message again to start a fresh sandbox.";

      await deps.saveMessage({
        projectId: input.projectId,
        content: userFacingMessage,
        role: "ASSISTANT",
        type: "ERROR",
      });

      return { error: userFacingMessage };
    }
  } else {
    // ── First run — create a new sandbox (user explicitly asked) ──────
    try {
      sandboxId = await deps.createSandbox(SANDBOX_TEMPLATE);
      console.log(
        `[CodeFlux] Created new sandbox ${sandboxId} for project ${input.projectId}`,
      );
    } catch (error) {
      const errStr = String(error);
      console.error("[CodeFlux] Sandbox creation failed:", errStr.slice(0, 300));

      let userFacingMessage: string;
      if (/(rate.?limit|ratelimiterror)/i.test(errStr)) {
        userFacingMessage =
          "⚠️ Sandbox rate limit reached (max concurrent sandboxes). Please wait a few minutes and try again.";
      } else if (errStr.includes("401") || errStr.includes("403")) {
        userFacingMessage = "⚠️ Sandbox authentication failed. Check your E2B API key.";
      } else {
        userFacingMessage = `⚠️ Failed to create sandbox: ${errStr.slice(0, 150)}`;
      }

      await deps.saveMessage({
        projectId: input.projectId,
        content: userFacingMessage,
        role: "ASSISTANT",
        type: "ERROR",
      });

      return { error: userFacingMessage };
    }
  }

  // -----------------------------------------------------------------------
  // Step 1b: Mark the project as GENERATING with the active sandboxId
  // -----------------------------------------------------------------------
  await deps.setProjectGenerating(input.projectId, sandboxId);

  // -----------------------------------------------------------------------
  // Steps 2-5 are wrapped in try/finally to guarantee release
  // -----------------------------------------------------------------------
  try {
    // ---------------------------------------------------------------------
    // Step 2: Build tools and shared state
    // ---------------------------------------------------------------------
    const state: CodeAgentState = {
      summary: "",
      files: {},
    };

    const tools = buildAgentTools(sandboxId, deps, state);

    // ---------------------------------------------------------------------
    // Step 3: Run the AI agent loop
    // ---------------------------------------------------------------------
    let agentResult;
    try {
      agentResult = await aiProvider.runAgentLoop(
        aiConfig,
        AGENT_SYSTEM_PROMPT,
        input.prompt,
        tools,
        MAX_ITERATIONS,
      );

      // Transfer state from the AI provider result back to our local state
      if (agentResult.state.summary) {
        state.summary = agentResult.state.summary;
      }
      if (agentResult.state.files && Object.keys(agentResult.state.files).length > 0) {
        state.files = { ...state.files, ...agentResult.state.files };
      }
    } catch (error) {
      // ── Handle upstream AI errors gracefully ────────────────────────
      console.error(
        "[CodeFlux] Upstream AI error (not a CodeFlux bug):",
        String(error).slice(0, 300),
      );

      const userFacingMessage = classifyAIError(error);

      await deps.saveMessage({
        projectId: input.projectId,
        content: userFacingMessage,
        role: "ASSISTANT",
        type: "ERROR",
      });

      return { error: userFacingMessage };
    }

    // ---------------------------------------------------------------------
    // Step 4: Determine success/failure
    // ---------------------------------------------------------------------
    const incomplete = isIncompleteResult(state.summary, state.files);

    // Get the live preview URL
    const sandboxPreviewUrl = await deps.getSandboxPreviewUrl(
      sandboxId,
      PREVIEW_PORT,
    );

    // ---------------------------------------------------------------------
    // Step 5: Persist the result
    // ---------------------------------------------------------------------
    if (incomplete) {
      const message = getIncompleteResultMessage(
        state.summary,
        state.files,
        agentResult.iterationCount,
      );

      await deps.saveMessage({
        projectId: input.projectId,
        content: message,
        role: "ASSISTANT",
        type: "ERROR",
      });

      return { error: message };
    }

    // Success — save the assistant message with an attached code fragment
    await deps.saveMessageWithFragment({
      projectId: input.projectId,
      content: state.summary,
      role: "ASSISTANT",
      type: "RESULT",
      fragment: {
        sandboxUrl: sandboxPreviewUrl,
        title: "Fragment",
        files: state.files,
      },
    });

    return {
      url: sandboxPreviewUrl,
      title: "Fragment",
      files: state.files,
      summary: state.summary,
    };
  } finally {
    // -----------------------------------------------------------------
    // Cleanup: release the project back to IDLE on any exit path.
    //
    // sandboxId is NOT cleared — the sandbox stays alive for reuse
    // on the next user message or retry.
    // -----------------------------------------------------------------
    try {
      await deps.releaseProject(input.projectId);
    } catch {
      // Best-effort — don't mask the original error
      console.error(
        `[CodeFlux] Failed to release project ${input.projectId} in finally block`,
      );
    }
  }
}
