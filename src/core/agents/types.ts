/**
 * @file core/agents/types.ts
 * @description Types for the multi-agent system.
 *
 * Defines the shared context object passed to every agent, per-agent
 * input/output contracts, and the orchestrator state.
 */

import type { EventBus } from "@/core/events/event-bus";
import type { AgentDependencies } from "@/core/agent/types";
import type { AIProvider, AIModelConfig } from "@/services/ai";

// ---------------------------------------------------------------------------
// Agent Context — Shared state bag passed to every agent
// ---------------------------------------------------------------------------

/**
 * The context object injected into every agent's `execute()` call.
 *
 * Contains everything an agent needs to do its work WITHOUT importing
 * any concrete provider. This is the multi-agent equivalent of
 * `AgentDependencies` from the original single-agent design.
 */
export interface AgentContext {
  /** The project this run belongs to. */
  projectId: string;

  /** The active sandbox ID (set after PlannerAgent phase). */
  sandboxId: string;

  /** Event bus for emitting streaming updates. */
  eventBus: EventBus;

  /** The original user prompt. */
  userPrompt: string;

  /** Injected infrastructure dependencies (sandbox, DB, etc.). */
  deps: AgentDependencies;

  /** AI provider for making LLM calls. */
  aiProvider: AIProvider;

  /** AI model configuration. */
  aiConfig: AIModelConfig;

  /**
   * Optional template context — present when the user selected a
   * preconfigured template. Allows agents to skip planning and
   * focus on customization.
   */
  template?: {
    /** Template ID. */
    id: string;
    /** Pre-defined plan (replaces PlannerAgent output). */
    plan: {
      description: string;
      steps: string[];
      filesToCreate: string[];
      dependenciesToInstall: string[];
    };
    /** Instructions telling the CoderAgent what's already built. */
    customizationPrompt: string;
  };
}

// ---------------------------------------------------------------------------
// Orchestrator State — Shared mutable state across all agent phases
// ---------------------------------------------------------------------------

/**
 * Mutable state that flows through the orchestrator pipeline.
 *
 * Each agent reads from and writes to relevant fields. The orchestrator
 * passes this object from agent to agent, accumulating results.
 */
export interface OrchestratorState {
  /** The structured plan from PlannerAgent. */
  plan: {
    description: string;
    steps: string[];
    filesToCreate: string[];
    dependenciesToInstall: string[];
  } | null;

  /** Map of relative file paths → file contents (accumulated). */
  files: Record<string, string>;

  /** The agent's task summary (set by CoderAgent on completion). */
  summary: string;

  /** The live sandbox preview URL. */
  previewUrl: string;

  /** Current build attempt number (used by retry controller). */
  buildAttempt: number;

  /** Last build error output (fed to DebuggerAgent). */
  lastBuildError: string;

  /** Whether the build passed verification. */
  buildPassed: boolean;

  /** Start timestamp for total duration tracking. */
  startedAt: number;
}

/**
 * Creates a fresh orchestrator state.
 */
export function createInitialState(): OrchestratorState {
  return {
    plan: null,
    files: {},
    summary: "",
    previewUrl: "",
    buildAttempt: 0,
    lastBuildError: "",
    buildPassed: false,
    startedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Planner-Specific Types
// ---------------------------------------------------------------------------

/** Input to the PlannerAgent. */
export interface PlannerInput {
  prompt: string;
}

/** Output from the PlannerAgent. */
export interface PlannerOutput {
  plan: {
    description: string;
    steps: string[];
    filesToCreate: string[];
    dependenciesToInstall: string[];
  };
}

// ---------------------------------------------------------------------------
// Coder-Specific Types
// ---------------------------------------------------------------------------

/** Input to the CoderAgent. */
export interface CoderInput {
  prompt: string;
  plan: PlannerOutput["plan"];
  /** Override max AI iterations (default 30, use 8 for templates). */
  maxIterations?: number;
}

/** Output from the CoderAgent. */
export interface CoderOutput {
  files: Record<string, string>;
  summary: string;
}

// ---------------------------------------------------------------------------
// Builder-Specific Types
// ---------------------------------------------------------------------------

/** Input to the BuildAgent. */
export interface BuilderInput {
  /** Command to run for build verification. */
  command: string;
}

/** Output from the BuildAgent. */
export interface BuilderOutput {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Debugger-Specific Types
// ---------------------------------------------------------------------------

/** Input to the DebuggerAgent. */
export interface DebuggerInput {
  /** The build error output. */
  error: string;
  /** Current retry attempt number. */
  attempt: number;
  /** Files that currently exist in the sandbox. */
  currentFiles: Record<string, string>;
}

/** Output from the DebuggerAgent. */
export interface DebuggerOutput {
  /** Files that were modified to fix the error. */
  filesModified: string[];
  /** Human-readable description of the fix. */
  description: string;
}

// ---------------------------------------------------------------------------
// Verifier-Specific Types
// ---------------------------------------------------------------------------

/** Input to the VerifierAgent. */
export interface VerifierInput {
  /** Files that were generated. */
  files: Record<string, string>;
  /** Expected preview port. */
  previewPort: number;
}

/** Output from the VerifierAgent. */
export interface VerifierOutput {
  success: boolean;
  previewUrl: string;
  results: Array<{ check: string; passed: boolean; detail?: string }>;
}
