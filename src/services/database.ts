/**
 * @file services/database.ts
 * @description Interface for database providers.
 *
 * Any database system (Prisma/PostgreSQL, Drizzle, raw SQL, DynamoDB, etc.)
 * must implement this interface. Core logic and module handlers use this
 * to persist data — they never import Prisma or any ORM directly.
 */

import type {
  Project,
  Message,
  MessageRole,
  MessageType,
  ProjectStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Input Types
// ---------------------------------------------------------------------------

/** Input for creating a new project. */
export interface CreateProjectInput {
  name: string;
  initialMessage?: {
    content: string;
    role: MessageRole;
    type: MessageType;
  };
}

/** Input for creating a new message. */
export interface CreateMessageInput {
  projectId: string;
  content: string;
  role: MessageRole;
  type: MessageType;
}

/** Input for creating a message with an attached code fragment. */
export interface CreateMessageWithFragmentInput {
  projectId: string;
  content: string;
  role: MessageRole;
  type: MessageType;
  fragment: {
    sandboxUrl: string;
    title: string;
    files: Record<string, string>;
  };
}

// ---------------------------------------------------------------------------
// Database Provider Interface
// ---------------------------------------------------------------------------

/**
 * Contract that every database provider must satisfy.
 *
 * Covers all data operations needed by the application's business logic.
 */
export interface DatabaseProvider {
  // -- Projects -------------------------------------------------------------

  /**
   * Create a new project.
   * @returns The created project.
   */
  createProject(input: CreateProjectInput): Promise<Project>;

  /**
   * Get all projects ordered by most recently updated.
   */
  getProjects(): Promise<Project[]>;

  /**
   * Get a single project by ID.
   * @returns The project, or null if not found.
   */
  getProjectById(id: string): Promise<Project | null>;

  // -- Messages -------------------------------------------------------------

  /**
   * Create a new message.
   * @returns The created message.
   */
  createMessage(input: CreateMessageInput): Promise<Message>;

  /**
   * Create a message with an attached code fragment.
   * @returns The created message.
   */
  createMessageWithFragment(
    input: CreateMessageWithFragmentInput,
  ): Promise<Message>;

  /**
   * Get all messages ordered by most recently updated.
   */
  getMessages(): Promise<Message[]>;

  /**
   * Get all messages for a specific project.
   */
  getMessagesByProjectId(projectId: string): Promise<Message[]>;

  // -- Project Sandbox Management -------------------------------------------

  /**
   * Get the current sandboxId for a project.
   * @returns The sandboxId, or null if no sandbox is assigned.
   */
  getProjectSandboxId(projectId: string): Promise<string | null>;

  /**
   * Mark a project as GENERATING and store the active sandboxId.
   */
  setProjectGenerating(
    projectId: string,
    sandboxId: string,
  ): Promise<void>;

  /**
   * Release a project after an agent run completes (success or error).
   *
   * Sets status back to IDLE and optionally stores the final sandboxUrl.
   * KEEPS sandboxId so the sandbox can be reused on the next run.
   */
  releaseProject(
    projectId: string,
    sandboxUrl?: string,
  ): Promise<void>;

  /**
   * Clear a dead/expired sandboxId from the project.
   *
   * Sets sandboxId to null and status to IDLE. Used when a reconnect
   * attempt reveals the sandbox has expired.
   */
  clearProjectSandbox(projectId: string): Promise<void>;
}
