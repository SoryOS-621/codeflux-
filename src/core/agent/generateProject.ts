/**
 * @file core/agent/generateProject.ts
 * @description Top-level use-case: Generate a project from a user prompt.
 *
 * This is the main entry point for the AI code generation workflow.
 * It manages the sandbox lifecycle (acquire / release) and delegates
 * all orchestration to the multi-agent Orchestrator:
 *
 *   1. Acquire sandbox (reconnect or create)
 *   2. Orchestrator.run() → Planner → Coder → Builder → Debugger → Verifier
 *   3. Persist result to database
 *   4. Release project
 *
 * This module is PURE business logic — no external provider imports.
 * All I/O happens through injected dependencies.
 */

import type {
  GenerateProjectInput,
  GenerateProjectResult,
  AgentDependencies,
} from "./types";
import type { AIProvider, AIModelConfig } from "@/services/ai";
import { classifyAIError } from "./helpers";
import { Orchestrator } from "@/core/orchestrator/orchestrator";
import type { AgentContext } from "@/core/agents/types";
import { getTemplateById } from "@/core/templates";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The E2B sandbox template to use. */
const SANDBOX_TEMPLATE = "codeflux-nextjs-test-2-modified";

// ---------------------------------------------------------------------------
// Orchestrator Singleton
// ---------------------------------------------------------------------------

const orchestrator = new Orchestrator();

// ---------------------------------------------------------------------------
// Main Use-Case
// ---------------------------------------------------------------------------

/**
 * Generate a project from a user prompt.
 *
 * This is called by the queue handler (Inngest, SQS, etc.) after a job
 * is dequeued. It manages the sandbox lifecycle and delegates all code
 * generation orchestration to the multi-agent Orchestrator.
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

      const userFacingMessage =
        "⚠️ Your previous sandbox has expired. Please send your message again to start a fresh sandbox.";

      await deps.saveMessage({
        projectId: input.projectId,
        content: userFacingMessage,
        role: "ASSISTANT",
        type: "ERROR",
      });

      // Emit fatal_error event so SSE clients are informed
      deps.eventBus.emit("fatal_error", "generateProject", input.projectId, {
        error: userFacingMessage,
        phase: "sandbox_acquisition",
        recoverable: true,
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

      deps.eventBus.emit("fatal_error", "generateProject", input.projectId, {
        error: userFacingMessage,
        phase: "sandbox_creation",
        recoverable: true,
      });

      return { error: userFacingMessage };
    }
  }

  // -----------------------------------------------------------------------
  // Step 1b: Mark the project as GENERATING with the active sandboxId
  // -----------------------------------------------------------------------
  await deps.setProjectGenerating(input.projectId, sandboxId);

  // -----------------------------------------------------------------------
  // Step 2: Seed template files (if a template was selected)
  // -----------------------------------------------------------------------
  const template = input.templateId
    ? getTemplateById(input.templateId)
    : undefined;

  if (template) {
    console.log(
      `[CodeFlux] Seeding template "${template.id}" (${Object.keys(template.files).length} files) into sandbox ${sandboxId}`,
    );

    deps.eventBus.emit("status_update", "generateProject", input.projectId, {
      message: `Loading template: ${template.name}...`,
    });

    const fileEntries = Object.entries(template.files).map(([path, content]) => ({
      path,
      content,
    }));

    await deps.runStep("seed-template-files", async () => {
      await deps.writeSandboxFiles(sandboxId, fileEntries);
    });

    console.log(
      `[CodeFlux] Template files written successfully`,
    );
  }

  // -----------------------------------------------------------------------
  // Step 3: Run the multi-agent orchestrator
  // -----------------------------------------------------------------------
  try {
    // Build the agent context from the injected dependencies
    const context: AgentContext = {
      projectId: input.projectId,
      sandboxId,
      eventBus: deps.eventBus,
      userPrompt: input.prompt,
      deps,
      aiProvider,
      aiConfig,
      template: template
        ? {
            id: template.id,
            plan: template.plan,
            customizationPrompt: template.customizationPrompt,
          }
        : undefined,
    };

    // Run the full pipeline: Planner → Coder → Builder → Debugger → Verifier
    const result = await orchestrator.run(input.prompt, context);

    // -----------------------------------------------------------------
    // Step 3: Persist the result
    // -----------------------------------------------------------------
    await deps.saveMessageWithFragment({
      projectId: input.projectId,
      content: result.summary,
      role: "ASSISTANT",
      type: "RESULT",
      fragment: {
        sandboxUrl: result.url,
        title: result.title,
        files: result.files,
      },
    });

    return result;
  } catch (error) {
    // ── Handle errors gracefully ──────────────────────────────────────
    console.error(
      "[CodeFlux] Orchestrator error:",
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
  } finally {
    // -----------------------------------------------------------------
    // Cleanup: release the project back to IDLE on any exit path.
    // sandboxId is NOT cleared — the sandbox stays alive for reuse.
    // -----------------------------------------------------------------
    try {
      await deps.releaseProject(input.projectId);
    } catch {
      console.error(
        `[CodeFlux] Failed to release project ${input.projectId} in finally block`,
      );
    }
  }
}
