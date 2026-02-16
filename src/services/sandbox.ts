/**
 * @file services/sandbox.ts
 * @description Interface for sandbox/execution environment providers.
 *
 * Any sandbox system (E2B, self-hosted Docker, Firecracker, etc.) must
 * implement this interface. Core agent logic uses this to create sandboxes,
 * execute commands, and read/write files — never importing a specific SDK.
 */

import type { ExecutionResult, SandboxFile, SandboxLogEntry } from "@/types";

/**
 * Contract that every sandbox provider must satisfy.
 *
 * The sandbox provider manages isolated execution environments where
 * the AI agent can run commands, create files, and preview output.
 */
export interface SandboxProvider {
  /**
   * Create a new sandbox from a template.
   *
   * @param template - The sandbox template identifier.
   * @returns The unique sandbox ID for subsequent operations.
   */
  create(template: string): Promise<string>;

  /**
   * Connect to an existing sandbox by ID.
   *
   * @param sandboxId - The sandbox ID returned by `create()`.
   */
  connect(sandboxId: string): Promise<void>;

  /**
   * Execute a shell command in the sandbox.
   *
   * @param sandboxId - The sandbox to run the command in.
   * @param command   - The shell command to execute.
   * @returns The execution result (stdout, stderr, exit code).
   */
  execute(sandboxId: string, command: string): Promise<ExecutionResult>;

  /**
   * Write files to the sandbox filesystem.
   *
   * @param sandboxId - The sandbox to write files into.
   * @param files     - Array of files to write.
   */
  writeFiles(sandboxId: string, files: SandboxFile[]): Promise<void>;

  /**
   * Read files from the sandbox filesystem.
   *
   * @param sandboxId - The sandbox to read files from.
   * @param paths     - Array of absolute file paths to read.
   * @returns Array of file objects with path and content.
   */
  readFiles(
    sandboxId: string,
    paths: string[],
  ): Promise<SandboxFile[]>;

  /**
   * Get the live preview URL for a sandbox's dev server.
   *
   * @param sandboxId - The sandbox to get the URL for.
   * @param port      - The port the dev server is running on.
   * @returns The publicly accessible preview URL.
   */
  getPreviewUrl(sandboxId: string, port: number): Promise<string>;

  /**
   * Check whether a sandbox is still alive / reachable.
   *
   * Returns `true` if the sandbox can be connected to, `false` if it has
   * expired or is otherwise unreachable. Must never throw.
   *
   * @param sandboxId - The sandbox to check.
   */
  isAlive(sandboxId: string): Promise<boolean>;

  /**
   * Get structured logs from a running sandbox.
   *
   * Uses the E2B API's `/sandboxes/{sandboxID}/logs` endpoint to fetch
   * system-level logs (process stdout/stderr, init, errors).
   *
   * @param sandboxId - The sandbox to fetch logs for.
   * @param opts      - Optional: limit (max entries) and startMs (start timestamp in ms).
   * @returns Array of structured log entries.
   */
  getLogs(
    sandboxId: string,
    opts?: { limit?: number; startMs?: number },
  ): Promise<SandboxLogEntry[]>;

  /**
   * Kill / shut down a running sandbox, freeing its resources immediately.
   *
   * This should be idempotent — calling it on an already-dead sandbox
   * must not throw.
   *
   * @param sandboxId - The sandbox to kill.
   */
  kill(sandboxId: string): Promise<void>;
}
