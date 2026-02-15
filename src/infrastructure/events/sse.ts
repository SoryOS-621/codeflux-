/**
 * @file infrastructure/events/sse.ts
 * @description Server-Sent Events (SSE) implementation of EventStreamProvider.
 *
 * Bridges the in-process EventBus to HTTP SSE streams. Each connected
 * client gets a `ReadableStream<Uint8Array>` that:
 *
 * 1. Replays historical events (so late-joining clients see the full run)
 * 2. Streams new events in real-time as they arrive
 * 3. Auto-completes when the agent run finishes (completed / fatal_error)
 * 4. Cleans up on client disconnect (ReadableStream cancel)
 *
 * ## SSE Wire Format
 * Each event is sent as:
 * ```
 * id: <sequence>
 * event: <type>
 * data: <JSON payload>
 *
 * ```
 *
 * Clients can use `EventSource` or `fetch()` to consume the stream.
 * The `id` field enables automatic reconnection with `Last-Event-ID`.
 */

import type { EventStreamProvider } from "@/services/events";
import type { EventBus } from "@/core/events/event-bus";
import type { AgentEvent } from "@/core/events/types";

// ---------------------------------------------------------------------------
// SSE Event Stream Provider
// ---------------------------------------------------------------------------

export class SSEEventStreamProvider implements EventStreamProvider {
  /** Active connection count per project. */
  private connections = new Map<string, number>();

  constructor(private readonly eventBus: EventBus) {}

  /**
   * Create a ReadableStream that emits SSE-formatted events for a project.
   *
   * The stream replays historical events, then streams live events,
   * and completes when the run finishes or the client disconnects.
   */
  createStream(projectId: string): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    let abortSubscription: (() => void) | null = null;

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        // Track connection
        this.incrementConnections(projectId);

        // Send initial SSE comment (keeps proxies from timing out)
        controller.enqueue(encoder.encode(": connected\n\n"));

        // Subscribe to the EventBus (with history replay)
        const { iterable, abort } = this.eventBus.subscribe(projectId, true);
        abortSubscription = abort;

        // Async pump: pull events from the AsyncIterable and push to stream
        (async () => {
          try {
            for await (const event of iterable) {
              const sseFrame = this.formatSSE(event);
              controller.enqueue(encoder.encode(sseFrame));
            }
            // Iterable completed (run finished) — close the stream
            controller.close();
          } catch (err) {
            // Stream was cancelled by the client, or another error
            if (
              err instanceof Error &&
              err.message.includes("Controller is already closed")
            ) {
              // Expected when client disconnects — ignore
            } else {
              console.error(
                `[SSE] Stream error for project ${projectId}:`,
                err,
              );
              try {
                controller.error(err);
              } catch {
                // Controller might already be closed
              }
            }
          } finally {
            this.decrementConnections(projectId);
          }
        })();
      },

      cancel: () => {
        // Client disconnected — abort the subscription
        if (abortSubscription) {
          abortSubscription();
          abortSubscription = null;
        }
        this.decrementConnections(projectId);
      },
    });
  }

  /**
   * Returns the number of active SSE connections for a project.
   */
  getActiveConnections(projectId: string): number {
    return this.connections.get(projectId) ?? 0;
  }

  // -----------------------------------------------------------------------
  // SSE Formatting
  // -----------------------------------------------------------------------

  /**
   * Format an AgentEvent as an SSE frame.
   *
   * Format:
   * ```
   * id: 42
   * event: files_written
   * data: {"type":"files_written","projectId":"abc",...}
   *
   * ```
   *
   * Using `id:` enables EventSource automatic reconnection with
   * `Last-Event-ID`, and `event:` allows clients to listen for
   * specific event types.
   */
  private formatSSE(event: AgentEvent): string {
    const lines: string[] = [];
    lines.push(`id: ${event.sequence}`);
    lines.push(`event: ${event.type}`);

    // SSE spec requires multi-line data to be split across `data:` lines
    const json = JSON.stringify(event);
    for (const line of json.split("\n")) {
      lines.push(`data: ${line}`);
    }

    // Two newlines terminate the SSE frame
    return lines.join("\n") + "\n\n";
  }

  // -----------------------------------------------------------------------
  // Connection Tracking
  // -----------------------------------------------------------------------

  private incrementConnections(projectId: string): void {
    this.connections.set(
      projectId,
      (this.connections.get(projectId) ?? 0) + 1,
    );
  }

  private decrementConnections(projectId: string): void {
    const current = this.connections.get(projectId) ?? 0;
    if (current <= 1) {
      this.connections.delete(projectId);
    } else {
      this.connections.set(projectId, current - 1);
    }
  }
}
