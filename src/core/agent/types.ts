/**
 * @file core/agent/types.ts
 * @description Types specific to the agent orchestration core.
 *
 * Re-exports shared types from `@/types` and adds core-specific types
 * that are only used within the agent orchestration layer.
 */

export type {
  CodeAgentState,
  GenerateProjectInput,
  GenerateProjectResult,
  ExecutionResult,
  SandboxFile,
  SandboxLogEntry,
} from "@/types";

/**
 * Dependencies injected into the core agent logic.
 *
 * The core never imports concrete implementations — it receives
 * providers via this dependency bag. This enables:
 * - Easy testing with mock providers
 * - Swapping providers without touching business logic
 */
export interface AgentDependencies {
  /** Creates a new sandbox and returns its ID. */
  createSandbox: (template: string) => Promise<string>;
  /** Checks whether a sandbox is still alive / reachable. */
  isSandboxAlive: (sandboxId: string) => Promise<boolean>;
  /** Executes a shell command in the sandbox. */
  executeSandboxCommand: (
    sandboxId: string,
    command: string,
  ) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
  /** Writes files to the sandbox. */
  writeSandboxFiles: (
    sandboxId: string,
    files: Array<{ path: string; content: string }>,
  ) => Promise<void>;
  /** Reads files from the sandbox. */
  readSandboxFiles: (
    sandboxId: string,
    paths: string[],
  ) => Promise<Array<{ path: string; content: string }>>;
  /** Gets the live preview URL. */
  getSandboxPreviewUrl: (sandboxId: string, port: number) => Promise<string>;
  /** Gets structured logs from the sandbox (system-level process/error logs). */
  getSandboxLogs: (
    sandboxId: string,
    opts?: { limit?: number; startMs?: number },
  ) => Promise<Array<{ level: string; message: string; timestamp: string; fields?: Record<string, string> }>>;
  /** Saves a message to the database. */
  saveMessage: (data: {
    projectId: string;
    content: string;
    role: "USER" | "ASSISTANT";
    type: "RESULT" | "ERROR";
  }) => Promise<unknown>;
  /** Saves a message with an attached code fragment. */
  saveMessageWithFragment: (data: {
    projectId: string;
    content: string;
    role: "USER" | "ASSISTANT";
    type: "RESULT" | "ERROR";
    fragment: {
      sandboxUrl: string;
      title: string;
      files: Record<string, string>;
    };
  }) => Promise<unknown>;
  /** Gets the existing sandboxId for a project (null if none). */
  getProjectSandboxId: (projectId: string) => Promise<string | null>;
  /** Mark the project as GENERATING and store the sandboxId. */
  setProjectGenerating: (
    projectId: string,
    sandboxId: string,
  ) => Promise<void>;
  /** Release the project back to IDLE. Keeps sandboxId for reuse. */
  releaseProject: (
    projectId: string,
    sandboxUrl?: string,
  ) => Promise<void>;
  /** Clear a dead sandboxId from the project and set IDLE. */
  clearProjectSandbox: (projectId: string) => Promise<void>;
}
