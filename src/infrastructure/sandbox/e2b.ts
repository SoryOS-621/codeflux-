/**
 * @file infrastructure/sandbox/e2b.ts
 * @description E2B implementation of the SandboxProvider interface.
 *
 * This is the ONLY file that imports the `@e2b/code-interpreter` SDK.
 * All other layers access sandbox functionality through the SandboxProvider interface.
 */

import type { SandboxProvider } from "@/services/sandbox";
import type { ExecutionResult, SandboxFile, SandboxLogEntry } from "@/types";
import { Sandbox } from "@e2b/code-interpreter";
import { ConnectionConfig, ApiClient } from "e2b";

/**
 * Sandbox provider backed by E2B cloud sandboxes.
 *
 * E2B sandboxes persist between steps, so we reconnect (rather than
 * create a new one) each time a tool handler runs.
 */
export class E2BSandboxProvider implements SandboxProvider {
  async create(template: string): Promise<string> {
    const sandbox = await Sandbox.create(template);
    return sandbox.sandboxId;
  }

  async connect(sandboxId: string): Promise<void> {
    // connect is used internally — for E2B we reconnect on each operation
    await Sandbox.connect(sandboxId);
  }

  async execute(sandboxId: string, command: string): Promise<ExecutionResult> {
    const sandbox = await Sandbox.connect(sandboxId);
    const outputBuffers = { stdout: "", stderr: "" };

    try {
      const result = await sandbox.commands.run(command, {
        onStdout: (data: string) => {
          outputBuffers.stdout += data;
        },
        onStderr: (data: string) => {
          outputBuffers.stderr += data;
        },
      });

      return {
        stdout: result.stdout,
        stderr: outputBuffers.stderr,
        exitCode: 0,
      };
    } catch (error) {
      console.log(
        `[E2B] Command failed: ${error}\n` +
          `stdout: ${outputBuffers.stdout}\n` +
          `stderr: ${outputBuffers.stderr}`,
      );
      return {
        stdout: outputBuffers.stdout,
        stderr: outputBuffers.stderr || String(error),
        exitCode: 1,
      };
    }
  }

  async writeFiles(sandboxId: string, files: SandboxFile[]): Promise<void> {
    const sandbox = await Sandbox.connect(sandboxId);
    for (const file of files) {
      await sandbox.files.write(file.path, file.content);
    }
  }

  async readFiles(
    sandboxId: string,
    paths: string[],
  ): Promise<SandboxFile[]> {
    const sandbox = await Sandbox.connect(sandboxId);
    const results: SandboxFile[] = [];

    for (const filePath of paths) {
      const content = await sandbox.files.read(filePath);
      results.push({ path: filePath, content });
    }

    return results;
  }

  async getPreviewUrl(sandboxId: string, port: number): Promise<string> {
    const sandbox = await Sandbox.connect(sandboxId);
    const host = sandbox.getHost(port);
    return `https://${host}`;
  }

  async isAlive(sandboxId: string): Promise<boolean> {
    try {
      await Sandbox.connect(sandboxId);
      return true;
    } catch {
      return false;
    }
  }

  async getLogs(
    sandboxId: string,
    opts?: { limit?: number; startMs?: number },
  ): Promise<SandboxLogEntry[]> {
    try {
      const config = new ConnectionConfig();
      const client = new ApiClient(config);

      // Call the E2B API's /sandboxes/{sandboxID}/logs endpoint directly,
      // since the SDK doesn't expose a higher-level method for this yet.
      const res = await (client as unknown as { api: {
        GET: (
          path: string,
          options: Record<string, unknown>,
        ) => Promise<{
          data?: {
            logs?: Array<{
              level: string;
              message: string;
              timestamp: string;
            }>;
            logEntries?: Array<{
              level: string;
              message: string;
              timestamp: string;
              fields?: Record<string, string>;
            }>;
          };
          error?: unknown;
        }>;
      } }).api.GET("/sandboxes/{sandboxID}/logs", {
        params: {
          path: { sandboxID: sandboxId },
          query: {
            ...(opts?.limit && { limit: opts.limit }),
            ...(opts?.startMs && { start: opts.startMs }),
          },
        },
      });

      if (res.error) {
        console.log(`[E2B] Failed to fetch logs for sandbox ${sandboxId}:`, res.error);
        return [];
      }

      // The API returns both `logs` (plain) and `logEntries` (structured).
      // Prefer structured logEntries if available.
      const entries = res.data?.logEntries ?? [];
      const plainLogs = res.data?.logs ?? [];

      const combined: SandboxLogEntry[] = entries.map((e) => ({
        level: e.level,
        message: e.message,
        timestamp: e.timestamp,
        fields: e.fields,
      }));

      // Append plain logs if logEntries were empty
      if (combined.length === 0 && plainLogs.length > 0) {
        for (const log of plainLogs) {
          combined.push({
            level: log.level,
            message: log.message,
            timestamp: log.timestamp,
          });
        }
      }

      return combined;
    } catch (error) {
      console.log(
        `[E2B] getLogs failed for sandbox ${sandboxId}: ${String(error).slice(0, 200)}`,
      );
      return [];
    }
  }

  async kill(sandboxId: string): Promise<void> {
    try {
      const sandbox = await Sandbox.connect(sandboxId);
      await sandbox.kill();
      console.log(`[E2B] Sandbox ${sandboxId} killed successfully.`);
    } catch (error) {
      // Idempotent — sandbox may already be dead or expired
      console.log(
        `[E2B] Sandbox ${sandboxId} kill skipped (already dead or expired): ${String(error).slice(0, 150)}`,
      );
    }
  }
}
