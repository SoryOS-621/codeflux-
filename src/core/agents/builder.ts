/**
 * @file core/agents/builder.ts
 * @description BuildAgent — runs build verification and streams output in real-time.
 *
 * The BuildAgent executes a TypeScript type-check (`npx tsc --noEmit`) in the
 * sandbox to verify the generated code compiles correctly. It streams stdout
 * and stderr incrementally as `log_stream` events so the user sees build
 * progress in real-time.
 *
 * The dev server is already running in the sandbox with hot reload, so we
 * only need to verify type correctness — not run a full Next.js build.
 */

import { BaseAgent } from "./base";
import type { AgentContext, BuilderInput, BuilderOutput } from "./types";

/** Default build command — type-check only (dev server is already running). */
const DEFAULT_BUILD_COMMAND = "npx tsc --noEmit 2>&1";

/** Maximum time to wait for the build command (ms). */
const _BUILD_TIMEOUT_MS = 120_000; // 2 minutes

export class BuildAgent extends BaseAgent<BuilderInput, BuilderOutput> {
  readonly name = "BuildAgent";

  async execute(
    input: BuilderInput,
    context: AgentContext,
  ): Promise<BuilderOutput> {
    const command = input.command || DEFAULT_BUILD_COMMAND;
    const startTime = Date.now();

    // Emit execution_started
    this.emit(context, "execution_started", { command });
    this.emitStatus(context, `Running build verification: ${command}`);

    try {
      // Execute the build command in the sandbox
      // The sandbox provider returns combined output — we stream it as
      // log_stream events for real-time UI updates.
      const result = await context.deps.executeSandboxCommand(
        context.sandboxId,
        command,
      );

      const durationMs = Date.now() - startTime;

      // Stream the output as log chunks
      if (result.stdout) {
        // Split into manageable chunks for streaming
        const chunks = this.splitIntoChunks(result.stdout, 1024);
        for (const chunk of chunks) {
          this.emit(context, "log_stream", {
            source: "stdout",
            chunk,
          });
        }
      }

      if (result.stderr) {
        const chunks = this.splitIntoChunks(result.stderr, 1024);
        for (const chunk of chunks) {
          this.emit(context, "log_stream", {
            source: "stderr",
            chunk,
          });
        }
      }

      const success = result.exitCode === 0;

      if (success) {
        this.emit(context, "execution_completed", {
          exitCode: result.exitCode,
          durationMs,
        });
        this.emitStatus(
          context,
          `Build verification passed (${(durationMs / 1000).toFixed(1)}s)`,
        );
      } else {
        this.emit(context, "execution_failed", {
          exitCode: result.exitCode,
          error: result.stderr || result.stdout,
          durationMs,
        });
        this.emitStatus(
          context,
          `Build verification failed (exit code ${result.exitCode})`,
        );
      }

      return {
        success,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorStr = String(error);

      this.emit(context, "execution_failed", {
        exitCode: 1,
        error: errorStr,
        durationMs,
      });
      this.logError("Build command execution failed", error);

      return {
        success: false,
        exitCode: 1,
        stdout: "",
        stderr: errorStr,
        durationMs,
      };
    }
  }

  /**
   * Split a string into chunks of a maximum size.
   * Used to stream large build outputs incrementally.
   */
  private splitIntoChunks(text: string, maxSize: number): string[] {
    const chunks: string[] = [];
    // Prefer splitting on newlines for readability
    const lines = text.split("\n");
    let current = "";

    for (const line of lines) {
      if (current.length + line.length + 1 > maxSize && current.length > 0) {
        chunks.push(current);
        current = "";
      }
      current += (current ? "\n" : "") + line;
    }

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }
}
