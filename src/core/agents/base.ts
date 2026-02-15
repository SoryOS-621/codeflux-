/**
 * @file core/agents/base.ts
 * @description Abstract base class for all agents in the multi-agent system.
 *
 * Every agent extends this class and implements `execute()`. The base
 * class provides:
 * - Typed event emission with agent name auto-attached
 * - Status update helper for narrative progress messages
 * - Consistent error handling pattern
 *
 * Agents are pure logic — they receive context via DI and never import
 * concrete providers.
 */

import type { AgentContext } from "./types";
import type {
  AgentEventType,
  AgentEventPayloadMap,
} from "@/core/events/types";

/**
 * Abstract base class that all agents must extend.
 *
 * @template TInput  - The typed input the agent expects.
 * @template TOutput - The typed output the agent produces.
 */
export abstract class BaseAgent<TInput, TOutput> {
  /** Human-readable agent name (used in events and logs). */
  abstract readonly name: string;

  /**
   * Execute the agent's core logic.
   *
   * Subclasses implement this method with their specific behavior.
   * The orchestrator calls this method and handles errors at the
   * orchestration level.
   *
   * @param input   - Typed input for this agent.
   * @param context - Shared context (sandbox, event bus, deps, etc.).
   * @returns The typed output from this agent.
   */
  abstract execute(input: TInput, context: AgentContext): Promise<TOutput>;

  // -----------------------------------------------------------------------
  // Event Helpers — Available to all agents
  // -----------------------------------------------------------------------

  /**
   * Emit a typed event through the EventBus.
   *
   * The agent's name and project ID are auto-attached from context.
   */
  protected emit<T extends AgentEventType>(
    context: AgentContext,
    type: T,
    payload: T extends keyof AgentEventPayloadMap
      ? AgentEventPayloadMap[T]
      : never,
  ): void {
    context.eventBus.emit(type, this.name, context.projectId, payload);
  }

  /**
   * Emit a human-readable status update.
   *
   * Use this for narrative progress messages that appear in the UI chat,
   * e.g. "Installing missing dependency..." or "Fixing syntax error in app/page.tsx..."
   */
  protected emitStatus(context: AgentContext, message: string): void {
    this.emit(context, "status_update", { message });
  }

  /**
   * Log a message to the console with the agent's name prefix.
   */
  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  /**
   * Log an error to the console with the agent's name prefix.
   */
  protected logError(message: string, error?: unknown): void {
    console.error(
      `[${this.name}] ${message}`,
      error ? String(error).slice(0, 300) : "",
    );
  }
}
