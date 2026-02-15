/**
 * @file core/orchestrator/orchestrator.ts
 * @description The central orchestrator — state machine that coordinates all agents.
 *
 * The Orchestrator implements the full agent pipeline:
 *
 *   User Prompt
 *   → PlannerAgent    (planning_started → planning_completed)
 *   → CoderAgent      (code_generation_started → files_written)
 *   → BuildAgent      (execution_started → log_stream → execution_completed/failed)
 *   → If fail:
 *       → DebuggerAgent (debug_started → fix_applied)
 *       → RetryController (retrying)
 *       → BuildAgent    (execution_started → ...)
 *       → Repeat (max 5 attempts)
 *   → VerifierAgent   (verification_started → verification_completed)
 *   → completed
 *
 * The orchestrator is PURE LOGIC — it never imports concrete providers.
 * All I/O happens through the injected AgentContext.
 *
 * Design for streaming:
 * - Every phase transition emits events through the EventBus
 * - Long-running operations (build) stream incremental output
 * - Errors are always visible to the user, never swallowed
 */

import type { AgentContext, OrchestratorState } from "@/core/agents/types";
import { createInitialState } from "@/core/agents/types";
import { PlannerAgent } from "@/core/agents/planner";
import { CoderAgent } from "@/core/agents/coder";
import { BuildAgent } from "@/core/agents/builder";
import { DebuggerAgent } from "@/core/agents/debugger";
import { VerifierAgent } from "@/core/agents/verifier";
import { RetryController } from "./retry-controller";
import type { GenerateProjectResult } from "@/types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Maximum build → debug → rebuild retry attempts. */
const MAX_BUILD_RETRIES = 5;

/** Build command to run in the sandbox. */
const BUILD_COMMAND = "npx tsc --noEmit 2>&1";

/** Port the sandbox dev server runs on. */
const PREVIEW_PORT = 3000;

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Orchestrates the multi-agent pipeline for code generation.
 *
 * This is the main entry point called by the queue handler. It replaces
 * the monolithic `generateProject()` function with a phased pipeline
 * that emits real-time streaming events at every step.
 */
export class Orchestrator {
  private readonly plannerAgent = new PlannerAgent();
  private readonly coderAgent = new CoderAgent();
  private readonly buildAgent = new BuildAgent();
  private readonly debuggerAgent = new DebuggerAgent();
  private readonly verifierAgent = new VerifierAgent();

  /**
   * Run the full agent pipeline.
   *
   * @param userPrompt - The user's natural-language prompt.
   * @param context    - Injected agent context (sandbox, event bus, deps, AI).
   * @returns The generation result on success.
   * @throws On fatal unrecoverable errors.
   */
  async run(
    userPrompt: string,
    context: AgentContext,
  ): Promise<GenerateProjectResult> {
    const state = createInitialState();

    // Step wrapper — makes each phase visible in the queue dashboard.
    // Falls back to a passthrough if no queue-level step wrapper is provided.
    const runStep = context.deps.runStep;

    try {
      // ═══════════════════════════════════════════════════════════════════
      // Phase 1: PLANNING (skipped when a template provides a pre-defined plan)
      // ═══════════════════════════════════════════════════════════════════
      let planResult: { plan: NonNullable<typeof state.plan> };

      if (context.template) {
        // ── Template mode: use pre-defined plan, skip AI planning ──────
        console.log(`[Orchestrator] ▸ Phase 1: PLANNING (skipped — using template "${context.template.id}")`);

        planResult = { plan: context.template.plan };
        state.plan = planResult.plan;

        context.eventBus.emit(
          "planning_started",
          "Orchestrator",
          context.projectId,
          { prompt: userPrompt },
        );
        context.eventBus.emit(
          "status_update",
          "Orchestrator",
          context.projectId,
          { message: `Using pre-built template — skipping planning phase...` },
        );
        context.eventBus.emit(
          "planning_completed",
          "Orchestrator",
          context.projectId,
          { plan: planResult.plan },
        );

        console.log(
          `[Orchestrator]   ✓ Template plan: ${state.plan.steps.length} steps, ${state.plan.filesToCreate.length} files`,
        );
      } else {
        // ── Normal mode: run the PlannerAgent ──────────────────────────
        console.log(`[Orchestrator] ▸ Phase 1: PLANNING for project ${context.projectId}`);

        planResult = await runStep("plan", () =>
          this.plannerAgent.execute({ prompt: userPrompt }, context),
        );
        state.plan = planResult.plan;

        console.log(
          `[Orchestrator]   ✓ Plan created: ${state.plan.steps.length} steps, ${state.plan.filesToCreate.length} files`,
        );
      }

      // ═══════════════════════════════════════════════════════════════════
      // Phase 2: CODE GENERATION
      // ═══════════════════════════════════════════════════════════════════
      console.log(`[Orchestrator] ▸ Phase 2: CODE GENERATION`);

      const coderResult = await runStep("generate-code", () =>
        this.coderAgent.execute(
          { prompt: userPrompt, plan: planResult.plan },
          context,
        ),
      );
      state.files = coderResult.files;
      state.summary = coderResult.summary;

      console.log(
        `[Orchestrator]   ✓ Code generated: ${Object.keys(state.files).length} files`,
      );

      // ═══════════════════════════════════════════════════════════════════
      // Phase 3: BUILD VERIFICATION + RETRY LOOP
      // ═══════════════════════════════════════════════════════════════════
      console.log(`[Orchestrator] ▸ Phase 3: BUILD VERIFICATION`);

      const retryController = new RetryController(
        context.eventBus,
        context.projectId,
        MAX_BUILD_RETRIES,
      );

      let buildPassed = false;

      // First build attempt
      const firstBuild = await runStep("build-check", () =>
        this.buildAgent.execute({ command: BUILD_COMMAND }, context),
      );

      if (firstBuild.success) {
        buildPassed = true;
        console.log(`[Orchestrator]   ✓ Build passed on first attempt`);
      } else {
        state.lastBuildError = firstBuild.stderr || firstBuild.stdout;
        console.log(`[Orchestrator]   ✗ Build failed, entering debug cycle...`);

        // ── Retry loop: debug → fix → rebuild ──────────────────────────
        while (!buildPassed && retryController.canRetry()) {
          const attempt = retryController.recordAttempt(state.lastBuildError);
          state.buildAttempt = attempt;

          // Run the debugger to analyze and fix the error
          console.log(`[Orchestrator]   ▸ Debug attempt ${attempt}`);

          await runStep(`debug-attempt-${attempt}`, () =>
            this.debuggerAgent.execute(
              {
                error: state.lastBuildError,
                attempt,
                currentFiles: state.files,
              },
              context,
            ),
          );

          // Run the build again
          context.eventBus.emit(
            "status_update",
            "Orchestrator",
            context.projectId,
            { message: `Re-running build verification (attempt ${attempt + 1})...` },
          );

          const retryBuild = await runStep(`build-check-${attempt + 1}`, () =>
            this.buildAgent.execute({ command: BUILD_COMMAND }, context),
          );

          if (retryBuild.success) {
            buildPassed = true;
            console.log(`[Orchestrator]   ✓ Build passed after ${attempt} fix attempt(s)`);
            context.eventBus.emit(
              "status_update",
              "Orchestrator",
              context.projectId,
              {
                message: `Build passed after ${attempt} fix attempt(s)!`,
              },
            );
          } else {
            state.lastBuildError = retryBuild.stderr || retryBuild.stdout;
          }
        }

        // If all retries exhausted, continue anyway (verification will flag it)
        if (!buildPassed) {
          console.log(
            `[Orchestrator]   ✗ Build still failing after ${retryController.getMaxAttempts()} attempts`,
          );
          context.eventBus.emit(
            "status_update",
            "Orchestrator",
            context.projectId,
            {
              message: `Build still failing after ${retryController.getMaxAttempts()} attempts. Proceeding to verification...`,
            },
          );
        }
      }

      state.buildPassed = buildPassed;

      // ═══════════════════════════════════════════════════════════════════
      // Phase 4: VERIFICATION
      // ═══════════════════════════════════════════════════════════════════
      console.log(`[Orchestrator] ▸ Phase 4: VERIFICATION`);

      const verifyResult = await runStep("verify", () =>
        this.verifierAgent.execute(
          { files: state.files, previewPort: PREVIEW_PORT },
          context,
        ),
      );

      state.previewUrl = verifyResult.previewUrl;
      console.log(
        `[Orchestrator]   ${verifyResult.success ? "✓" : "✗"} Verification ${verifyResult.success ? "passed" : "completed with issues"}`,
      );

      // ═══════════════════════════════════════════════════════════════════
      // Phase 5: COMPLETION
      // ═══════════════════════════════════════════════════════════════════
      const totalDurationMs = Date.now() - state.startedAt;
      console.log(
        `[Orchestrator] ✓ Complete — ${Object.keys(state.files).length} files, ${(totalDurationMs / 1000).toFixed(1)}s total`,
      );

      context.eventBus.emit("completed", "Orchestrator", context.projectId, {
        previewUrl: state.previewUrl,
        totalFiles: Object.keys(state.files).length,
        totalDurationMs,
        summary: state.summary,
      });

      return {
        url: state.previewUrl,
        title: "Fragment",
        files: state.files,
        summary: state.summary,
      };
    } catch (error) {
      // ═══════════════════════════════════════════════════════════════════
      // FATAL ERROR — Unrecoverable failure
      // ═══════════════════════════════════════════════════════════════════
      const errorStr = String(error);
      const phase = this.determineFailurePhase(state);

      context.eventBus.emit(
        "fatal_error",
        "Orchestrator",
        context.projectId,
        {
          error: errorStr.slice(0, 500),
          phase,
          recoverable: true, // User can retry by sending another message
        },
      );

      console.error(
        `[Orchestrator] Fatal error in ${phase}:`,
        errorStr.slice(0, 300),
      );

      throw error; // Re-throw so the caller (generateProject) can handle cleanup
    }
  }

  /**
   * Determine which phase a failure occurred in based on state progress.
   */
  private determineFailurePhase(state: OrchestratorState): string {
    if (!state.plan) return "planning";
    if (Object.keys(state.files).length === 0) return "code_generation";
    if (!state.buildPassed) return "build_verification";
    return "verification";
  }
}
