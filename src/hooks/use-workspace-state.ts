/**
 * @file hooks/use-workspace-state.ts
 * @description Derives workspace-level state from the SSE event stream.
 *
 * Maps raw AgentEvents into named phases, file lists, build logs,
 * terminal commands, real-time file contents, preview URLs, and
 * agent status that the workspace child components consume.
 */

"use client";

import { useMemo } from "react";
import type { AgentEvent } from "@/core/events/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Named phases shown in the progress bar. */
export type WorkspacePhase =
  | "idle"
  | "planning"
  | "coding"
  | "building"
  | "debugging"
  | "verifying"
  | "completed"
  | "error";

export interface TerminalCommand {
  /** The command that was executed. */
  command: string;
  /** Which agent executed it. */
  agent?: string;
  /** Timestamp of the command. */
  timestamp: number;
}

export interface WorkspaceState {
  /** The current phase of the agent run. */
  phase: WorkspacePhase;
  /** The structured plan from the planner agent, if available. */
  plan: {
    description: string;
    steps: string[];
    filesToCreate: string[];
    dependenciesToInstall: string[];
  } | null;
  /** List of file paths that have been written so far. */
  writtenFiles: string[];
  /** Real-time file contents map (path → content) from SSE events. */
  fileContents: Record<string, string>;
  /** Raw build/execution log lines. */
  buildLogs: Array<{ source: "stdout" | "stderr"; chunk: string }>;
  /** Terminal commands executed in the sandbox. */
  terminalCommands: TerminalCommand[];
  /** The live preview URL — available early from preview_url_available event. */
  previewUrl: string | null;
  /** The agent's summary text from the completed event. */
  summary: string | null;
  /** Error message if the run ended with a fatal error. */
  fatalError: string | null;
  /** Current debug attempt number (0 if not debugging). */
  debugAttempt: number;
  /** Max debug attempts. */
  maxDebugAttempts: number;
  /** The name of the currently active agent. */
  currentAgent: string | null;
  /** The latest status message from the running agent. */
  latestAgentStatus: string | null;
}

// ---------------------------------------------------------------------------
// Phase derivation
// ---------------------------------------------------------------------------

function derivePhase(events: AgentEvent[]): WorkspacePhase {
  if (events.length === 0) return "idle";

  // Walk backward to find the latest phase-changing event
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    switch (e.type) {
      case "fatal_error":
        return "error";
      case "completed":
        return "completed";
      case "verification_started":
      case "verification_completed":
        return "verifying";
      case "debug_started":
      case "fix_applied":
        return "debugging";
      case "execution_started":
      case "execution_completed":
      case "execution_failed":
        return "building";
      case "code_generation_started":
      case "files_written":
      case "terminal_command":
        return "coding";
      case "planning_started":
      case "planning_completed":
        return "planning";
    }
  }

  return "idle";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Derives structured workspace state from an array of agent events.
 * All derivations are memoized based on event array length.
 */
export function useWorkspaceState(events: AgentEvent[]): WorkspaceState {
  return useMemo(() => {
    const phase = derivePhase(events);

    // Extract plan from planning_completed event
    const planEvent = events.find((e) => e.type === "planning_completed");
    const plan = planEvent
      ? (planEvent.payload as WorkspaceState["plan"])
      : null;

    // Collect all written file paths
    const writtenFiles = events
      .filter((e) => e.type === "files_written")
      .flatMap((e) => (e.payload as { paths: string[] }).paths);

    // Collect real-time file contents from files_written events
    const fileContents: Record<string, string> = {};
    for (const e of events) {
      if (e.type === "files_written") {
        const payload = e.payload as { files?: Record<string, string> };
        if (payload.files) {
          Object.assign(fileContents, payload.files);
        }
      }
    }

    // Collect build logs
    const buildLogs = events
      .filter((e) => e.type === "log_stream")
      .map((e) => e.payload as { source: "stdout" | "stderr"; chunk: string });

    // Collect terminal commands
    const terminalCommands: TerminalCommand[] = events
      .filter((e) => e.type === "terminal_command")
      .map((e) => ({
        command: (e.payload as { command: string }).command,
        agent: (e.payload as { agent?: string }).agent,
        timestamp: e.timestamp,
      }));

    // Get preview URL — prefer early preview_url_available, fall back to completed
    const previewUrlEvent = events.find((e) => e.type === "preview_url_available");
    const completedEvent = events.find((e) => e.type === "completed");
    const previewUrl = previewUrlEvent
      ? (previewUrlEvent.payload as { url: string }).url
      : completedEvent
        ? (completedEvent.payload as { previewUrl: string }).previewUrl
        : null;

    // Get summary from completed event
    const summary = completedEvent
      ? (completedEvent.payload as { summary: string }).summary
      : null;

    // Get fatal error
    const errorEvent = events.find((e) => e.type === "fatal_error");
    const fatalError = errorEvent
      ? (errorEvent.payload as { error: string }).error
      : null;

    // Get debug attempt info
    const retryEvents = events.filter((e) => e.type === "retrying");
    const lastRetry = retryEvents[retryEvents.length - 1];
    const debugAttempt = lastRetry
      ? (lastRetry.payload as { attempt: number }).attempt
      : 0;
    const maxDebugAttempts = lastRetry
      ? (lastRetry.payload as { maxAttempts: number }).maxAttempts
      : 5;

    // Derive current agent from the latest event's agentName
    const lastEvent = events[events.length - 1];
    const currentAgent = lastEvent?.agentName ?? null;

    // Get latest status message
    const statusEvents = events.filter((e) => e.type === "status_update");
    const latestAgentStatus = statusEvents.length > 0
      ? (statusEvents[statusEvents.length - 1].payload as { message: string }).message
      : null;

    return {
      phase,
      plan,
      writtenFiles: [...new Set(writtenFiles)],
      fileContents,
      buildLogs,
      terminalCommands,
      previewUrl,
      summary,
      fatalError,
      debugAttempt,
      maxDebugAttempts,
      currentAgent,
      latestAgentStatus,
    };
  }, [events]);
}
