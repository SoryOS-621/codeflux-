/**
 * @file services/events.ts
 * @description Interface for event streaming providers.
 *
 * Any event transport (SSE, WebSocket, polling, etc.) must implement this
 * interface. The orchestrator and agents use the EventBus directly; this
 * interface defines how events are delivered to external consumers (UI clients).
 *
 * The EventBus lives in core/ and is provider-agnostic.
 * This interface lives in services/ and defines the transport contract.
 */

import type { AgentEvent } from "@/core/events/types";

/**
 * Contract that every event streaming transport must satisfy.
 *
 * The transport is responsible for:
 * 1. Accepting a stream of AgentEvents for a project
 * 2. Delivering them to connected clients in real-time
 * 3. Handling client connect/disconnect lifecycle
 */
export interface EventStreamProvider {
  /**
   * Create a readable stream of events for a project.
   *
   * Used by API routes (e.g. SSE endpoint) to pipe events to the client.
   * The stream should complete when the agent run finishes or the client
   * disconnects.
   *
   * @param projectId - The project to stream events for.
   * @returns A ReadableStream of serialized event data.
   */
  createStream(projectId: string): ReadableStream<Uint8Array>;

  /**
   * Get the number of active client connections for a project.
   * Useful for monitoring and deciding whether to buffer events.
   */
  getActiveConnections(projectId: string): number;
}
