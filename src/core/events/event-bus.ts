/**
 * @file core/events/event-bus.ts
 * @description In-process event bus for agent-to-transport communication.
 *
 * The EventBus is the central nervous system of the multi-agent architecture.
 * Agents emit events into the bus; transports (SSE, WebSocket, DB logger)
 * subscribe and forward them to their destinations.
 *
 * Design principles:
 * - Project-scoped: each project run gets isolated event delivery
 * - Non-blocking: emit() never awaits listeners (fire-and-forget)
 * - Iterable: subscribers can consume events as an AsyncIterable (for SSE)
 * - Sequence-numbered: events carry monotonic IDs for ordering
 * - No external dependencies: pure TypeScript, no Node EventEmitter import
 */

import type {
  AgentEvent,
  AgentEventType,
  AgentEventPayloadMap,
  AnyAgentEventListener,
} from "./types";

// ---------------------------------------------------------------------------
// EventBus
// ---------------------------------------------------------------------------

/**
 * Per-project event bus that agents push events into and transports
 * pull events from.
 *
 * Usage from an agent:
 * ```ts
 * eventBus.emit("files_written", "CoderAgent", projectId, {
 *   paths: ["app/page.tsx"],
 *   totalFiles: 1,
 * });
 * ```
 *
 * Usage from a transport (SSE endpoint):
 * ```ts
 * for await (const event of eventBus.subscribe(projectId)) {
 *   controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
 * }
 * ```
 */
export class EventBus {
  /** Global sequence counter — monotonically increasing across all projects. */
  private sequence = 0;

  /** Per-project wildcard listeners. */
  private projectListeners = new Map<string, Set<AnyAgentEventListener>>();

  /** Global wildcard listeners (for logging, metrics, etc.). */
  private globalListeners = new Set<AnyAgentEventListener>();

  /** Per-project event history (for replay on late subscribers). */
  private eventHistory = new Map<string, AgentEvent[]>();

  /** Maximum events to retain per project (prevents memory leaks). */
  private readonly maxHistoryPerProject = 500;

  // -----------------------------------------------------------------------
  // Emit
  // -----------------------------------------------------------------------

  /**
   * Emit a typed event into the bus.
   *
   * This is fire-and-forget — listeners are invoked synchronously but
   * errors in listeners are caught and logged (never propagated to the
   * emitting agent).
   */
  emit<T extends AgentEventType>(
    type: T,
    agentName: string,
    projectId: string,
    payload: T extends keyof AgentEventPayloadMap
      ? AgentEventPayloadMap[T]
      : never,
  ): AgentEvent<T> {
    const event: AgentEvent<T> = {
      type,
      timestamp: Date.now(),
      projectId,
      agentName,
      sequence: ++this.sequence,
      payload,
    };

    // Persist to history
    this.appendHistory(projectId, event as AgentEvent);

    // Notify project-scoped listeners
    const projectSubs = this.projectListeners.get(projectId);
    if (projectSubs) {
      for (const listener of projectSubs) {
        try {
          listener(event as AgentEvent);
        } catch (err) {
          console.error(
            `[EventBus] Listener error for project ${projectId}:`,
            err,
          );
        }
      }
    }

    // Notify global listeners
    for (const listener of this.globalListeners) {
      try {
        listener(event as AgentEvent);
      } catch (err) {
        console.error("[EventBus] Global listener error:", err);
      }
    }

    return event;
  }

  // -----------------------------------------------------------------------
  // Subscribe (callback-based)
  // -----------------------------------------------------------------------

  /**
   * Register a listener for all events on a specific project.
   *
   * @returns An unsubscribe function.
   */
  on(projectId: string, listener: AnyAgentEventListener): () => void {
    if (!this.projectListeners.has(projectId)) {
      this.projectListeners.set(projectId, new Set());
    }
    this.projectListeners.get(projectId)!.add(listener);

    return () => {
      this.projectListeners.get(projectId)?.delete(listener);
      // Clean up empty sets
      if (this.projectListeners.get(projectId)?.size === 0) {
        this.projectListeners.delete(projectId);
      }
    };
  }

  /**
   * Register a global listener that receives events from ALL projects.
   * Useful for logging, metrics collection, or database persistence.
   *
   * @returns An unsubscribe function.
   */
  onGlobal(listener: AnyAgentEventListener): () => void {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  }

  // -----------------------------------------------------------------------
  // Subscribe (AsyncIterable — for SSE streaming)
  // -----------------------------------------------------------------------

  /**
   * Returns an AsyncIterable that yields events for a project as they arrive.
   *
   * The iterable completes when `completed` or `fatal_error` is emitted,
   * or when the returned `abort()` function is called (e.g. client disconnects).
   *
   * Optionally replays history first (for late-joining clients).
   *
   * @param projectId  - The project to subscribe to.
   * @param replay     - Whether to yield historical events first (default: true).
   * @returns An object with the async iterable and an abort function.
   */
  subscribe(
    projectId: string,
    replay = true,
  ): { iterable: AsyncIterable<AgentEvent>; abort: () => void } {
    let aborted = false;
    let resolveNext: ((value: IteratorResult<AgentEvent>) => void) | null =
      null;
    const buffer: AgentEvent[] = [];

    const abort = () => {
      aborted = true;
      if (resolveNext) {
        resolveNext({ value: undefined as unknown as AgentEvent, done: true });
        resolveNext = null;
      }
    };

    // Register listener that pushes events into the buffer or resolves
    // a pending next() call.
    const unsubscribe = this.on(projectId, (event) => {
      if (aborted) return;

      if (resolveNext) {
        resolveNext({ value: event, done: false });
        resolveNext = null;
      } else {
        buffer.push(event);
      }

      // Auto-complete on terminal events
      if (event.type === "completed" || event.type === "fatal_error") {
        // Give the consumer one more tick to read the terminal event,
        // then signal done on the next pull.
        queueMicrotask(() => {
          aborted = true;
          if (resolveNext) {
            resolveNext({
              value: undefined as unknown as AgentEvent,
              done: true,
            });
            resolveNext = null;
          }
        });
      }
    });

    const iterable: AsyncIterable<AgentEvent> = {
      [Symbol.asyncIterator]() {
        // Replay history first
        const history = replay
          ? [...(this as unknown as { _history: AgentEvent[] })._history]
          : [];
        let historyIndex = 0;

        // We need access to the history — store it on the iterable
        return {
          next(): Promise<IteratorResult<AgentEvent>> {
            // Drain replayed history
            if (historyIndex < history.length) {
              return Promise.resolve({
                value: history[historyIndex++],
                done: false,
              });
            }

            // Drain buffer
            if (buffer.length > 0) {
              return Promise.resolve({
                value: buffer.shift()!,
                done: false,
              });
            }

            // If already aborted, signal done
            if (aborted) {
              unsubscribe();
              return Promise.resolve({
                value: undefined as unknown as AgentEvent,
                done: true,
              });
            }

            // Wait for next event
            return new Promise((resolve) => {
              resolveNext = resolve;
            });
          },

          return(): Promise<IteratorResult<AgentEvent>> {
            abort();
            unsubscribe();
            return Promise.resolve({
              value: undefined as unknown as AgentEvent,
              done: true,
            });
          },
        };
      },
    };

    // Attach history to the iterable so the iterator can access it
    const history = replay ? this.getHistory(projectId) : [];
    (iterable as unknown as { _history: AgentEvent[] })._history = history;

    return { iterable, abort };
  }

  // -----------------------------------------------------------------------
  // History
  // -----------------------------------------------------------------------

  /**
   * Get all recorded events for a project.
   */
  getHistory(projectId: string): AgentEvent[] {
    return [...(this.eventHistory.get(projectId) ?? [])];
  }

  /**
   * Clear event history for a project (e.g. after persisting to DB).
   */
  clearHistory(projectId: string): void {
    this.eventHistory.delete(projectId);
  }

  /**
   * Check if a project has any active listeners.
   */
  hasListeners(projectId: string): boolean {
    return (this.projectListeners.get(projectId)?.size ?? 0) > 0;
  }

  // -----------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------

  private appendHistory(projectId: string, event: AgentEvent): void {
    if (!this.eventHistory.has(projectId)) {
      this.eventHistory.set(projectId, []);
    }
    const history = this.eventHistory.get(projectId)!;
    history.push(event);

    // Evict oldest events if over limit
    if (history.length > this.maxHistoryPerProject) {
      history.splice(0, history.length - this.maxHistoryPerProject);
    }
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  /**
   * Remove all listeners and history for a project.
   * Call after a run is fully complete and events have been persisted.
   */
  cleanup(projectId: string): void {
    this.projectListeners.delete(projectId);
    this.eventHistory.delete(projectId);
  }

  /**
   * Remove ALL listeners and history (for testing / shutdown).
   */
  reset(): void {
    this.projectListeners.clear();
    this.globalListeners.clear();
    this.eventHistory.clear();
    this.sequence = 0;
  }
}
