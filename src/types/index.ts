/**
 * @file types/index.ts
 * @description Shared domain types used across all layers of the application.
 *
 * These types are provider-agnostic and represent the core domain model.
 * No external library types (Prisma, Inngest, E2B, etc.) should appear here.
 */

// ---------------------------------------------------------------------------
// AI Types
// ---------------------------------------------------------------------------

/** Input payload for an AI generation request. */
export interface PromptInput {
  /** The system prompt that defines agent behaviour. */
  systemPrompt: string;
  /** The user's prompt describing what to build. */
  userPrompt: string;
  /** Model identifier (e.g. "openai/gpt-oss-120b:free"). */
  model: string;
  /** Optional temperature override (default: 0.1). */
  temperature?: number;
}

/** A single tool call the AI wants to make. */
export interface AIToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

/** The result returned from an AI generation cycle. */
export interface AIResponse {
  /** The assistant's text content. */
  content: string;
  /** Any tool calls the model wants to execute. */
  toolCalls?: AIToolCall[];
  /** Whether the model finished normally or was cut off. */
  finishReason: "stop" | "tool_calls" | "length" | "error";
}

// ---------------------------------------------------------------------------
// Queue / Job Types
// ---------------------------------------------------------------------------

/** Payload for a background job enqueued into the queue system. */
export interface JobPayload {
  /** Unique event name (e.g. "app/developer.generate"). */
  eventName: string;
  /** Arbitrary event data passed to the handler. */
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Sandbox Types
// ---------------------------------------------------------------------------

/** Result of executing a command in a sandbox environment. */
export interface ExecutionResult {
  /** Standard output from the command. */
  stdout: string;
  /** Standard error output from the command. */
  stderr: string;
  /** Exit code (0 = success). */
  exitCode: number;
}

/** A file to write into the sandbox. */
export interface SandboxFile {
  path: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Database / Domain Models
// ---------------------------------------------------------------------------

/** Role of a chat message sender. */
export type MessageRole = "USER" | "ASSISTANT";

/** Whether a message is a normal result or an error. */
export type MessageType = "RESULT" | "ERROR";

/** Status of the AI agent for a project. */
export type ProjectStatus = "IDLE" | "GENERATING";

/** A project workspace (provider-agnostic representation). */
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  sandboxId: string | null;
  sandboxUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A chat message in a project (provider-agnostic representation). */
export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  type: MessageType;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A generated code artifact attached to an AI response. */
export interface Fragment {
  id: string;
  messageId: string;
  sandboxUrl: string;
  title: string;
  files: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Agent State
// ---------------------------------------------------------------------------

/**
 * Shared state that persists across all iterations of the agent loop.
 *
 * - `summary`: Set when the agent outputs a `<task_summary>` block.
 * - `files`: Map of relative file paths → file contents for every file written.
 */
export interface CodeAgentState {
  summary: string;
  files: Record<string, string>;
}

/** Input to start a code generation job. */
export interface GenerateProjectInput {
  /** The user's natural-language prompt. */
  prompt: string;
  /** The project ID this generation belongs to. */
  projectId: string;
}

/** The result returned after a successful code generation. */
export interface GenerateProjectResult {
  /** Live sandbox preview URL. */
  url: string;
  /** Display title for the fragment. */
  title: string;
  /** Map of generated files. */
  files: Record<string, string>;
  /** The agent's task summary. */
  summary: string;
}
