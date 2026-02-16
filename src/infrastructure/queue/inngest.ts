/**
 * @file infrastructure/queue/inngest.ts
 * @description Inngest implementation of the QueueProvider interface.
 *
 * This is the ONLY file that imports Inngest for queue/event functionality.
 * It provides:
 * 1. `InngestQueueProvider` — implements QueueProvider for enqueuing jobs
 * 2. `inngestClient` — the shared Inngest client instance
 * 3. `createDeveloperAgentFunction` — factory that creates the Inngest function,
 *    accepting providers as arguments to avoid circular imports.
 *
 * The Inngest function is a THIN TRIGGER — it contains NO business logic.
 * All orchestration happens in `src/core/agent/generateProject.ts`.
 */

import "dotenv/config";
import { randomUUID } from "crypto";
import { Inngest } from "inngest";
import type { QueueProvider } from "@/services/queue";
import type { JobPayload } from "@/types";
import type { AIProvider, AIModelConfig } from "@/services/ai";
import type { SandboxProvider } from "@/services/sandbox";
import type { DatabaseProvider } from "@/services/database";
import { generateProject } from "@/core/agent/generateProject";

// ---------------------------------------------------------------------------
// Inngest Client
// ---------------------------------------------------------------------------

/** The shared Inngest client — used for both sending and receiving events. */
export const inngestClient = new Inngest({ id: "codeflux" });

// ---------------------------------------------------------------------------
// Queue Provider
// ---------------------------------------------------------------------------

/**
 * Queue provider backed by Inngest.
 *
 * Enqueues jobs by sending Inngest events. The Inngest Dev Server (local)
 * or Inngest Cloud (production) picks them up and invokes the registered
 * function handlers.
 */
export class InngestQueueProvider implements QueueProvider {
  async enqueue(job: JobPayload): Promise<void> {
    await inngestClient.send({
      name: job.eventName,
      data: {
        ...job.data,
        // Unique per enqueue call — ensures each trigger gets its own
        // step.run() memoization scope. Retries of the same event keep
        // the same runId (desirable for idempotent replay).
        runId: randomUUID().slice(0, 8),
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Inngest Function Factory — Thin trigger layer
// ---------------------------------------------------------------------------

/**
 * Creates the Inngest function that handles the "app/developer.generate" event.
 *
 * Uses a factory pattern to receive provider dependencies without creating
 * circular imports (infrastructure/index.ts → queue/inngest.ts → infrastructure/index.ts).
 *
 * This is a THIN TRIGGER — it only:
 * 1. Extracts the event data
 * 2. Calls the core `generateProject()` use-case
 * 3. Returns the result
 *
 * NO business logic, AI calls, or sandbox management lives here.
 */
export function createDeveloperAgentFunction(
  aiProvider: AIProvider,
  aiConfig: AIModelConfig,
  sandboxProvider: SandboxProvider,
  databaseProvider: DatabaseProvider,
) {
  return inngestClient.createFunction(
    {
      id: "developer-agent",
      retries: 2,
      // Only 1 agent run per project at a time — prevents duplicate sandboxes
      // when a user sends rapid follow-up messages or retries trigger.
      concurrency: {
        limit: 1,
        key: "event.data.projectId",
      },
    },
    { event: "app/developer.generate" },
    async ({ event, step }) => {
      const { prompt, projectId, runId } = event.data as {
        prompt: string;
        projectId: string;
        runId: string;
      };

      // runId is used as a suffix in step names so each new event
      // gets fresh step execution while retries stay memoized.
      const s = (name: string) => `${name}-${runId}`;

      // Delegate ALL logic to the core use-case.
      // Each dependency is wrapped in step.run() so it appears as a
      // visible sub-step in the Inngest dev server for observability.
      const result = await generateProject(
        { prompt, projectId },
        aiProvider,
        aiConfig,
        {
          createSandbox: (template) =>
            step.run(s("create-sandbox"), () => sandboxProvider.create(template)),
          isSandboxAlive: (id) =>
            step.run(s("check-sandbox-alive"), () => sandboxProvider.isAlive(id)),
          executeSandboxCommand: (id, cmd) =>
            sandboxProvider.execute(id, cmd),
          writeSandboxFiles: (id, files) =>
            sandboxProvider.writeFiles(id, files),
          readSandboxFiles: (id, paths) =>
            sandboxProvider.readFiles(id, paths),
          getSandboxPreviewUrl: (id, port) =>
            step.run(s("get-sandbox-url"), () => sandboxProvider.getPreviewUrl(id, port)),
          getSandboxLogs: (id, opts) =>
            sandboxProvider.getLogs(id, opts),
          saveMessage: (data) =>
            step.run(s("save-message"), () => databaseProvider.createMessage(data)),
          saveMessageWithFragment: (data) =>
            step.run(s("save-message-with-fragment"), () =>
              databaseProvider.createMessageWithFragment(data),
            ),
          getProjectSandboxId: (projId) =>
            step.run(s("get-project-sandbox-id"), () =>
              databaseProvider.getProjectSandboxId(projId),
            ),
          setProjectGenerating: async (projId, sbxId) => {
            await step.run(s("set-project-generating"), () =>
              databaseProvider.setProjectGenerating(projId, sbxId),
            );
          },
          releaseProject: async (projId, sbxUrl) => {
            await step.run(s("release-project"), () =>
              databaseProvider.releaseProject(projId, sbxUrl),
            );
          },
          clearProjectSandbox: async (projId) => {
            await step.run(s("clear-project-sandbox"), () =>
              databaseProvider.clearProjectSandbox(projId),
            );
          },
        },
      );

      return result;
    },
  );
}
