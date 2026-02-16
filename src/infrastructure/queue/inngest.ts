/**
 * @file infrastructure/queue/inngest.ts
 * @description Inngest handler — Long-running agents run OUTSIDE step.run()
 * so their EventBus events stream to the frontend in real-time.
 *
 * step.run() is used ONLY for short, idempotent DB/sandbox operations.
 * Agent phases (plan, code, build, debug, verify) run directly in the
 * handler so eventBus.emit() calls reach SSE subscribers immediately.
 */

import "dotenv/config";
import { randomUUID } from "crypto";
import { Inngest } from "inngest";
import type { QueueProvider } from "@/services/queue";
import type { JobPayload } from "@/types";
import type { AIProvider, AIModelConfig } from "@/services/ai";
import type { SandboxProvider } from "@/services/sandbox";
import type { DatabaseProvider } from "@/services/database";
import type { EventBus } from "@/core/events/event-bus";
import type { AgentContext } from "@/core/agents/types";
import { classifyAIError } from "@/core/agent/helpers";
import { getTemplateById } from "@/core/templates";
import { PlannerAgent } from "@/core/agents/planner";
import { CoderAgent } from "@/core/agents/coder";
import { BuildAgent } from "@/core/agents/builder";
import { DebuggerAgent } from "@/core/agents/debugger";
import { VerifierAgent } from "@/core/agents/verifier";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SANDBOX_TEMPLATE = "codeflux-nextjs-test-2-modified";
const BUILD_COMMAND = "npx tsc --noEmit 2>&1";
const PREVIEW_PORT = 3000;
const MAX_BUILD_RETRIES = 5;

// ---------------------------------------------------------------------------
// Inngest Client
// ---------------------------------------------------------------------------

export const inngestClient = new Inngest({ id: "codeflux" });

// ---------------------------------------------------------------------------
// Queue Provider
// ---------------------------------------------------------------------------

export class InngestQueueProvider implements QueueProvider {
  async enqueue(job: JobPayload): Promise<void> {
    await inngestClient.send({
      name: job.eventName,
      data: {
        ...job.data,
        runId: randomUUID().slice(0, 8),
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Inngest Function
// ---------------------------------------------------------------------------

export function createDeveloperAgentFunction(
  aiProvider: AIProvider,
  aiConfig: AIModelConfig,
  sandboxProvider: SandboxProvider,
  databaseProvider: DatabaseProvider,
  eventBus: EventBus,
) {
  return inngestClient.createFunction(
    {
      id: "developer-agent",
      retries: 2,
      concurrency: {
        limit: 1,
        key: "event.data.projectId",
      },
    },
    { event: "app/developer.generate" },
    async ({ event, step }) => {
      const { prompt, projectId, runId, templateId } = event.data as {
        prompt: string;
        projectId: string;
        runId: string;
        templateId?: string;
      };

      const s = (name: string) => `${name}-${runId}`;

      // ═════════════════════════════════════════════════════════════════
      // Step 1: ACQUIRE SANDBOX   (step.run — short, idempotent)
      // ═════════════════════════════════════════════════════════════════
      const sandboxId = await step.run(s("acquire-sandbox"), async () => {
        const existingId = await databaseProvider.getProjectSandboxId(projectId);

        if (existingId) {
          const alive = await sandboxProvider.isAlive(existingId);
          if (alive) {
            console.log(`[CodeFlux] Reusing sandbox ${existingId}`);
            return existingId;
          }
          console.log(`[CodeFlux] Sandbox ${existingId} expired`);
          await databaseProvider.clearProjectSandbox(projectId);
          await databaseProvider.createMessage({
            projectId,
            content:
              "⚠️ Your previous sandbox has expired. Please send your message again to start a fresh sandbox.",
            role: "ASSISTANT",
            type: "ERROR",
          });
          return null;
        }

        try {
          const id = await sandboxProvider.create(SANDBOX_TEMPLATE);
          console.log(`[CodeFlux] Created sandbox ${id}`);
          return id;
        } catch (error) {
          const errStr = String(error);
          let msg: string;
          if (/(rate.?limit|ratelimiterror)/i.test(errStr)) {
            msg = "⚠️ Sandbox rate limit reached. Wait a few minutes and retry.";
          } else if (errStr.includes("401") || errStr.includes("403")) {
            msg = "⚠️ Sandbox authentication failed. Check your E2B API key.";
          } else {
            msg = `⚠️ Failed to create sandbox: ${errStr.slice(0, 150)}`;
          }
          await databaseProvider.createMessage({
            projectId,
            content: msg,
            role: "ASSISTANT",
            type: "ERROR",
          });
          return null;
        }
      });

      if (!sandboxId) {
        eventBus.emit("fatal_error", "generateProject", projectId, {
          error: "Sandbox unavailable",
          phase: "sandbox_acquisition",
          recoverable: true,
        });
        return { error: "Sandbox unavailable" };
      }

      // ═════════════════════════════════════════════════════════════════
      // Step 2: MARK PROJECT GENERATING   (step.run — short DB write)
      // ═════════════════════════════════════════════════════════════════
      await step.run(s("set-project-generating"), () =>
        databaseProvider.setProjectGenerating(projectId, sandboxId),
      );

      // ═════════════════════════════════════════════════════════════════
      // Step 3: SEED TEMPLATE FILES   (step.run — short file write)
      // ═════════════════════════════════════════════════════════════════
      const template = templateId ? getTemplateById(templateId) : undefined;

      if (template) {
        await step.run(s("seed-template-files"), async () => {
          console.log(
            `[CodeFlux] Seeding template "${template.id}" (${Object.keys(template.files).length} files)`,
          );
          const files = Object.entries(template.files).map(
            ([path, content]) => ({ path, content }),
          );
          await sandboxProvider.writeFiles(sandboxId, files);
        });
      }

      // ── Build shared AgentContext ─────────────────────────────────
      const context: AgentContext = {
        projectId,
        sandboxId,
        eventBus,
        userPrompt: prompt,
        deps: {
          eventBus,
          runStep: async (_name, fn) => fn(),
          createSandbox: (t) => sandboxProvider.create(t),
          isSandboxAlive: (id) => sandboxProvider.isAlive(id),
          executeSandboxCommand: (id, cmd) => sandboxProvider.execute(id, cmd),
          writeSandboxFiles: (id, files) => sandboxProvider.writeFiles(id, files),
          readSandboxFiles: (id, paths) => sandboxProvider.readFiles(id, paths),
          getSandboxPreviewUrl: (id, port) =>
            sandboxProvider.getPreviewUrl(id, port),
          saveMessage: (data) => databaseProvider.createMessage(data),
          saveMessageWithFragment: (data) =>
            databaseProvider.createMessageWithFragment(data),
          getProjectSandboxId: (id) =>
            databaseProvider.getProjectSandboxId(id),
          setProjectGenerating: (id, sbx) =>
            databaseProvider.setProjectGenerating(id, sbx),
          releaseProject: (id, url) => databaseProvider.releaseProject(id, url),
          clearProjectSandbox: (id) =>
            databaseProvider.clearProjectSandbox(id),
        },
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

      // ═══════════════════════════════════════════════════════════════
      // AGENT PHASES — run OUTSIDE step.run() for real-time streaming
      // EventBus events (status_update, files_written, log_stream, etc.)
      // reach SSE subscribers immediately during execution.
      // ═══════════════════════════════════════════════════════════════

      try {
        // ─────────────────────────────────────────────────────────────
        // Phase 1: PLAN
        // ─────────────────────────────────────────────────────────────
        eventBus.emit("status_update", "Orchestrator", projectId, {
          message: "Starting planning phase...",
        });

        let planResult: { plan: { description: string; steps: string[]; filesToCreate: string[]; dependenciesToInstall: string[] } };

        if (context.template) {
          console.log(
            `[Orchestrator] Using template plan (${context.template.plan.steps.length} steps)`,
          );
          eventBus.emit("planning_started", "Orchestrator", projectId, {
            prompt,
          });
          eventBus.emit("status_update", "Orchestrator", projectId, {
            message: "Using pre-built template — skipping planning phase...",
          });
          eventBus.emit("planning_completed", "Orchestrator", projectId, {
            plan: context.template.plan,
          });
          planResult = { plan: context.template.plan };
        } else {
          const planner = new PlannerAgent();
          planResult = await planner.execute({ prompt }, context);
        }

        console.log(
          `[Orchestrator] Plan: ${planResult.plan.steps.length} steps, ${planResult.plan.filesToCreate.length} files`,
        );

        // ─────────────────────────────────────────────────────────────
        // Phase 2: GENERATE CODE  (the big one — streams events live)
        // ─────────────────────────────────────────────────────────────
        eventBus.emit("status_update", "Orchestrator", projectId, {
          message: template
            ? "Customizing template (fast mode)..."
            : "Starting code generation...",
        });

        const coder = new CoderAgent();
        const codeResult = await coder.execute(
          {
            prompt,
            plan: planResult.plan,
            maxIterations: template ? 8 : 30,
          },
          context,
        );

        console.log(
          `[Orchestrator] Code generated: ${Object.keys(codeResult.files).length} files`,
        );

        // ─── Emit preview URL early ───────────────────────────────────
        // The sandbox dev server is already running — get the URL now
        // so the user can see the live preview while build checks run.
        try {
          const earlyPreviewUrl = await sandboxProvider.getPreviewUrl(
            sandboxId,
            PREVIEW_PORT,
          );
          if (earlyPreviewUrl) {
            eventBus.emit("preview_url_available", "Orchestrator", projectId, {
              url: earlyPreviewUrl,
              initial: true,
            });
            eventBus.emit("status_update", "Orchestrator", projectId, {
              message: "Live preview is now available!",
            });
          }
        } catch (e) {
          console.log(`[Orchestrator] Could not get early preview URL: ${e}`);
        }

        // ─────────────────────────────────────────────────────────────
        // Phase 3: BUILD CHECK
        // ─────────────────────────────────────────────────────────────
        eventBus.emit("status_update", "Orchestrator", projectId, {
          message: "Running build verification (tsc --noEmit)...",
        });

        const builder = new BuildAgent();
        const buildResult = await builder.execute(
          { command: BUILD_COMMAND },
          context,
        );

        // ─────────────────────────────────────────────────────────────
        // Phase 4: DEBUG + RETRY (only if build failed)
        // ─────────────────────────────────────────────────────────────
        let buildPassed = buildResult.success;
        let lastBuildError = buildResult.stderr || buildResult.stdout;

        if (!buildPassed) {
          console.log(`[Orchestrator] Build failed, entering debug cycle...`);

          for (let attempt = 1; attempt <= MAX_BUILD_RETRIES; attempt++) {
            eventBus.emit("retrying", "Orchestrator", projectId, {
              attempt,
              maxAttempts: MAX_BUILD_RETRIES,
              reason: lastBuildError.slice(0, 300),
            });

            eventBus.emit("status_update", "Orchestrator", projectId, {
              message: `Debug attempt ${attempt}/${MAX_BUILD_RETRIES}...`,
            });

            const debuggerAgent = new DebuggerAgent();
            await debuggerAgent.execute(
              {
                error: lastBuildError,
                attempt,
                currentFiles: codeResult.files,
              },
              context,
            );

            eventBus.emit("status_update", "Orchestrator", projectId, {
              message: `Re-running build (attempt ${attempt + 1})...`,
            });

            const retryBuilder = new BuildAgent();
            const retryBuild = await retryBuilder.execute(
              { command: BUILD_COMMAND },
              context,
            );

            if (retryBuild.success) {
              buildPassed = true;
              console.log(
                `[Orchestrator] Build passed after ${attempt} fix(es)`,
              );
              eventBus.emit("status_update", "Orchestrator", projectId, {
                message: `Build passed after ${attempt} fix attempt(s)!`,
              });
              break;
            }

            lastBuildError = retryBuild.stderr || retryBuild.stdout;
          }

          if (!buildPassed) {
            console.log(
              `[Orchestrator] Build still failing after ${MAX_BUILD_RETRIES} attempts`,
            );
            eventBus.emit("status_update", "Orchestrator", projectId, {
              message: `Build still failing after ${MAX_BUILD_RETRIES} attempts. Proceeding to verification...`,
            });
          }
        }

        // ─────────────────────────────────────────────────────────────
        // Phase 5: VERIFY
        // ─────────────────────────────────────────────────────────────
        eventBus.emit("status_update", "Orchestrator", projectId, {
          message: "Running verification checks...",
        });

        const verifier = new VerifierAgent();
        const verifyResult = await verifier.execute(
          { files: codeResult.files, previewPort: PREVIEW_PORT },
          context,
        );

        // ═════════════════════════════════════════════════════════════
        // Step: SAVE RESULT   (step.run — short DB write)
        // ═════════════════════════════════════════════════════════════
        eventBus.emit("completed", "Orchestrator", projectId, {
          previewUrl: verifyResult.previewUrl,
          totalFiles: Object.keys(codeResult.files).length,
          totalDurationMs: 0,
          summary: codeResult.summary,
        });

        await step.run(s("save-result"), async () => {
          await databaseProvider.createMessageWithFragment({
            projectId,
            content: codeResult.summary,
            role: "ASSISTANT",
            type: "RESULT",
            fragment: {
              sandboxUrl: verifyResult.previewUrl,
              title: "Fragment",
              files: codeResult.files,
            },
          });
        });

        // ═════════════════════════════════════════════════════════════
        // Step: RELEASE PROJECT   (step.run — short DB write)
        // ═════════════════════════════════════════════════════════════
        await step.run(s("release-project"), () =>
          databaseProvider.releaseProject(projectId),
        );

        return {
          url: verifyResult.previewUrl,
          title: "Fragment",
          files: codeResult.files,
          summary: codeResult.summary,
        };
      } catch (error) {
        console.error(
          "[CodeFlux] Agent error:",
          String(error).slice(0, 300),
        );

        const userFacingMessage = classifyAIError(error);

        eventBus.emit("fatal_error", "Orchestrator", projectId, {
          error: userFacingMessage,
          phase: "agent_execution",
          recoverable: true,
        });

        await step.run(s("save-error"), async () => {
          await databaseProvider.createMessage({
            projectId,
            content: userFacingMessage,
            role: "ASSISTANT",
            type: "ERROR",
          });
        });

        await step.run(s("release-project-on-error"), () =>
          databaseProvider.releaseProject(projectId),
        );

        return { error: userFacingMessage };
      }
    },
  );
}
