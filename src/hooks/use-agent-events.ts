/**
 * @file hooks/use-agent-events.ts
 * @description React hook for consuming real-time agent events via SSE.
 *
 * Connects to the SSE endpoint and maintains a live array of `AgentEvent`
 * objects. Supports auto-reconnection, filtering by event type, and
 * detecting when the run is complete.
 *
 * Usage:
 * ```tsx
 * const { events, isConnected, isComplete, latestStatus } =
 *   useAgentEvents(projectId);
 *
 * // Render the latest status message
 * <p>{latestStatus}</p>
 *
 * // Access all events
 * events.map(e => ...)
 *
 * // Filter to specific types
 * const fileEvents = events.filter(e => e.type === "files_written");
 * ```
 */

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { AgentEvent, AgentEventType } from "@/core/events/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAgentEventsOptions {
  /** Whether to connect to the SSE stream. Defaults to true. */
  enabled?: boolean;
  /** Maximum retry attempts on connection failure. Defaults to 5. */
  maxRetries?: number;
  /** Interval between retry attempts in ms. Defaults to 2000. */
  retryIntervalMs?: number;
}

export interface UseAgentEventsReturn {
  /** All received events in chronological order. */
  events: AgentEvent[];
  /** Whether the SSE connection is currently active. */
  isConnected: boolean;
  /** Whether the agent run has completed (success or fatal error). */
  isComplete: boolean;
  /** The latest human-readable status message, if any. */
  latestStatus: string | null;
  /** The latest error, if the run ended with a fatal error. */
  error: string | null;
  /** Filter events by type. */
  getEventsByType: <T extends AgentEventType>(type: T) => AgentEvent<T>[];
  /** Manually disconnect and clear events. */
  disconnect: () => void;
}

// ---------------------------------------------------------------------------
// Default Config
// ---------------------------------------------------------------------------

const DEFAULT_OPTIONS: Required<UseAgentEventsOptions> = {
  enabled: true,
  maxRetries: 5,
  retryIntervalMs: 2000,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAgentEvents(
  projectId: string | null | undefined,
  options?: UseAgentEventsOptions,
): UseAgentEventsReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [latestStatus, setLatestStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // Event Handler
  // -----------------------------------------------------------------------

  const handleEvent = useCallback((rawEvent: MessageEvent) => {
    try {
      const agentEvent: AgentEvent = JSON.parse(rawEvent.data);

      setEvents((prev) => [...prev, agentEvent]);

      // Track status updates
      if (
        agentEvent.type === "status_update" &&
        "message" in agentEvent.payload
      ) {
        setLatestStatus(
          (agentEvent.payload as { message: string }).message,
        );
      }

      // Detect terminal states
      if (agentEvent.type === "completed") {
        setIsComplete(true);
      }

      if (agentEvent.type === "fatal_error") {
        setIsComplete(true);
        if ("error" in agentEvent.payload) {
          setError(
            (agentEvent.payload as { error: string }).error,
          );
        }
      }
    } catch (err) {
      console.warn("[useAgentEvents] Failed to parse SSE data:", err);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Connection Management
  // -----------------------------------------------------------------------

  const connect = useCallback(() => {
    if (!projectId || !config.enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/projects/${projectId}/events`;
    const source = new EventSource(url);
    eventSourceRef.current = source;

    source.onopen = () => {
      setIsConnected(true);
      retryCountRef.current = 0; // Reset retries on successful connection
    };

    // Listen on default "message" event and all typed events
    source.onmessage = handleEvent;

    // Also listen for each specific event type via addEventListener
    const eventTypes: AgentEventType[] = [
      "planning_started",
      "planning_completed",
      "code_generation_started",
      "files_written",
      "execution_started",
      "log_stream",
      "execution_completed",
      "execution_failed",
      "debug_started",
      "fix_applied",
      "retrying",
      "verification_started",
      "verification_completed",
      "completed",
      "fatal_error",
      "status_update",
    ];

    for (const type of eventTypes) {
      source.addEventListener(type, handleEvent as EventListener);
    }

    source.onerror = () => {
      setIsConnected(false);
      source.close();
      eventSourceRef.current = null;

      // Don't retry if the run is already complete
      if (isComplete) return;

      // Retry with backoff
      if (retryCountRef.current < config.maxRetries) {
        retryCountRef.current++;
        retryTimerRef.current = setTimeout(connect, config.retryIntervalMs);
      }
    };
  }, [projectId, config.enabled, config.maxRetries, config.retryIntervalMs, handleEvent, isComplete]);

  // -----------------------------------------------------------------------
  // Disconnect
  // -----------------------------------------------------------------------

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setIsConnected(false);
    setEvents([]);
    setIsComplete(false);
    setLatestStatus(null);
    setError(null);
    retryCountRef.current = 0;
  }, []);

  // -----------------------------------------------------------------------
  // Effect: Connect/Disconnect on projectId or enabled change
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!projectId || !config.enabled) {
      disconnect();
      return;
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, config.enabled]);

  // -----------------------------------------------------------------------
  // Auto-close EventSource when run completes
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (isComplete && eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, [isComplete]);

  // -----------------------------------------------------------------------
  // Filter helper
  // -----------------------------------------------------------------------

  const getEventsByType = useCallback(
    <T extends AgentEventType>(type: T): AgentEvent<T>[] => {
      return events.filter((e): e is AgentEvent<T> => e.type === type);
    },
    [events],
  );

  // -----------------------------------------------------------------------
  // Memoized return value
  // -----------------------------------------------------------------------

  return useMemo(
    () => ({
      events,
      isConnected,
      isComplete,
      latestStatus,
      error,
      getEventsByType,
      disconnect,
    }),
    [events, isConnected, isComplete, latestStatus, error, getEventsByType, disconnect],
  );
}
