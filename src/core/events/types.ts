/**
 * @file core/events/types.ts
 * @description Typed event definitions for the multi-agent streaming system.
 *
 * Every agent emits structured events through the EventBus. These events
 * drive real-time UI updates (via SSE), database logging, and orchestrator
 * state transitions.
 *
 * Events are designed to be serializable (no functions, no circular refs)
 * so they can be sent over SSE, stored in DB, and replayed on page refresh.
 */

// ---------------------------------------------------------------------------
// Event Type Literals
// ---------------------------------------------------------------------------

/**
 * All possible event types emitted during an agent run.
 *
 * Naming convention: `<phase>_<action>` in snake_case.
 */
export type AgentEventType =
  // Planning phase
  | "planning_started"
  | "planning_completed"
  // Code generation phase
  | "code_generation_started"
  | "files_written"
  // Terminal / command execution during coding
  | "terminal_command"
  // Build / execution phase
  | "execution_started"
  | "log_stream"
  | "execution_completed"
  | "execution_failed"
  // Debug / fix phase
  | "debug_started"
  | "fix_applied"
  | "retrying"
  // Verification phase
  | "verification_started"
  | "verification_completed"
  // Preview URL available (emitted early, before completion)
  | "preview_url_available"
  // Terminal states
  | "completed"
  | "fatal_error"
  // Narrative status updates (human-readable progress messages)
  | "status_update";

// ---------------------------------------------------------------------------
// Per-Event Payload Types
// ---------------------------------------------------------------------------

export interface PlanningStartedPayload {
  prompt: string;
}

export interface PlanningCompletedPayload {
  /** Structured plan produced by the PlannerAgent. */
  plan: {
    description: string;
    steps: string[];
    filesToCreate: string[];
    dependenciesToInstall: string[];
  };
}

export interface CodeGenerationStartedPayload {
  /** The plan step currently being worked on, if applicable. */
  currentStep?: string;
}

export interface FilesWrittenPayload {
  /** Paths of files that were written in this batch. */
  paths: string[];
  /** Total file count so far. */
  totalFiles: number;
  /** Actual file contents (path → content map) for real-time editor updates. */
  files?: Record<string, string>;
}

export interface TerminalCommandPayload {
  /** The command being executed in the sandbox. */
  command: string;
  /** Which agent is executing this command. */
  agent?: string;
}

export interface ExecutionStartedPayload {
  /** The command being executed (e.g. "npx tsc --noEmit"). */
  command: string;
}

export interface LogStreamPayload {
  /** Which output stream this chunk came from. */
  source: "stdout" | "stderr";
  /** The raw text chunk. */
  chunk: string;
}

export interface ExecutionCompletedPayload {
  /** Exit code from the command. */
  exitCode: number;
  /** Duration in milliseconds. */
  durationMs: number;
}

export interface ExecutionFailedPayload {
  /** Exit code from the command. */
  exitCode: number;
  /** The stderr output (or relevant error excerpt). */
  error: string;
  /** Duration in milliseconds. */
  durationMs: number;
}

export interface DebugStartedPayload {
  /** The error being analyzed. */
  error: string;
  /** Which retry attempt this debug cycle is for. */
  attempt: number;
}

export interface FixAppliedPayload {
  /** Files that were modified to fix the error. */
  filesModified: string[];
  /** Human-readable description of the fix. */
  description: string;
}

export interface RetryingPayload {
  /** Current attempt number (1-indexed). */
  attempt: number;
  /** Maximum allowed attempts. */
  maxAttempts: number;
  /** Reason for retrying. */
  reason: string;
}

export interface VerificationStartedPayload {
  /** What checks are being run. */
  checks: string[];
}

export interface VerificationCompletedPayload {
  /** Whether all checks passed. */
  success: boolean;
  /** Results of individual checks. */
  results: Array<{ check: string; passed: boolean; detail?: string }>;
}

export interface PreviewUrlAvailablePayload {
  /** The live preview URL. */
  url: string;
  /** Whether this is the first time the URL is available. */
  initial: boolean;
}

export interface CompletedPayload {
  /** Live preview URL. */
  previewUrl: string;
  /** Total files generated. */
  totalFiles: number;
  /** Total duration of the entire orchestration in milliseconds. */
  totalDurationMs: number;
  /** Agent's task summary. */
  summary: string;
}

export interface FatalErrorPayload {
  /** The error message. */
  error: string;
  /** Which phase the error occurred in. */
  phase: string;
  /** Whether the error is recoverable (user can retry). */
  recoverable: boolean;
}

export interface StatusUpdatePayload {
  /** Human-readable narrative message (e.g. "Installing missing dependency..."). */
  message: string;
}

// ---------------------------------------------------------------------------
// Payload Map — Maps event types to their payload types
// ---------------------------------------------------------------------------

export interface AgentEventPayloadMap {
  planning_started: PlanningStartedPayload;
  planning_completed: PlanningCompletedPayload;
  code_generation_started: CodeGenerationStartedPayload;
  files_written: FilesWrittenPayload;
  terminal_command: TerminalCommandPayload;
  execution_started: ExecutionStartedPayload;
  log_stream: LogStreamPayload;
  execution_completed: ExecutionCompletedPayload;
  execution_failed: ExecutionFailedPayload;
  debug_started: DebugStartedPayload;
  fix_applied: FixAppliedPayload;
  retrying: RetryingPayload;
  verification_started: VerificationStartedPayload;
  verification_completed: VerificationCompletedPayload;
  preview_url_available: PreviewUrlAvailablePayload;
  completed: CompletedPayload;
  fatal_error: FatalErrorPayload;
  status_update: StatusUpdatePayload;
}

// ---------------------------------------------------------------------------
// Core AgentEvent Interface
// ---------------------------------------------------------------------------

/**
 * A single structured event emitted by an agent during execution.
 *
 * Generic over `T` to enforce type-safe payloads:
 * ```ts
 * const event: AgentEvent<"files_written"> = {
 *   type: "files_written",
 *   timestamp: Date.now(),
 *   projectId: "abc",
 *   agentName: "CoderAgent",
 *   payload: { paths: ["app/page.tsx"], totalFiles: 1 },
 * };
 * ```
 */
export interface AgentEvent<T extends AgentEventType = AgentEventType> {
  /** The event type identifier. */
  type: T;
  /** Unix timestamp (ms) when the event was created. */
  timestamp: number;
  /** The project this event belongs to. */
  projectId: string;
  /** Which agent emitted this event. */
  agentName: string;
  /** Monotonically increasing sequence number within a run. */
  sequence: number;
  /** Type-safe payload for this event type. */
  payload: T extends keyof AgentEventPayloadMap
    ? AgentEventPayloadMap[T]
    : never;
}

// ---------------------------------------------------------------------------
// EventBus Listener Types
// ---------------------------------------------------------------------------

/** Callback for a specific event type. */
export type AgentEventListener<T extends AgentEventType = AgentEventType> = (
  event: AgentEvent<T>,
) => void;

/** Callback for any event (wildcard listener). */
export type AnyAgentEventListener = (event: AgentEvent) => void;
