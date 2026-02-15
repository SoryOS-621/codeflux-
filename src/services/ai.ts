/**
 * @file services/ai.ts
 * @description Interface for AI/LLM providers.
 *
 * Any AI provider (OpenRouter, OpenAI direct, Anthropic, local models, etc.)
 * must implement this interface. Business logic in `/core` depends ONLY on
 * this interface — never on a concrete provider.
 */

import type {
  CodeAgentState,
  GenerateProjectInput,
} from "@/types";

// ---------------------------------------------------------------------------
// AI Model Configuration
// ---------------------------------------------------------------------------

/** Configuration for the AI model to use. */
export interface AIModelConfig {
  /** Model identifier (e.g. "openai/gpt-oss-120b:free"). */
  model: string;
  /** API key for the provider. */
  apiKey: string;
  /** Base URL for the API endpoint. */
  baseUrl: string;
  /** Temperature for generation (0.0–2.0). */
  temperature?: number;
}

// ---------------------------------------------------------------------------
// Agent Tool Definitions
// ---------------------------------------------------------------------------

/** A tool that the AI agent can call during its generation loop. */
export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Agent Run Result
// ---------------------------------------------------------------------------

/** Result returned after a full agent network run. */
export interface AgentRunResult {
  state: CodeAgentState;
  iterationCount: number;
}

// ---------------------------------------------------------------------------
// AI Provider Interface
// ---------------------------------------------------------------------------

/**
 * Contract that every AI provider must satisfy.
 *
 * The provider is responsible for:
 * 1. Creating an AI agent with the given system prompt and tools
 * 2. Running the agent loop until completion or max iterations
 * 3. Returning the accumulated state (generated files + summary)
 */
export interface AIProvider {
  /**
   * Run the full AI agent loop.
   *
   * @param config     - Model configuration (model name, API key, base URL).
   * @param systemPrompt - The system prompt defining agent behaviour.
   * @param userPrompt   - The user's request/prompt.
   * @param tools        - Tools the agent may call (terminal, file ops, etc.).
   * @param maxIterations - Maximum loop iterations (safety cap).
   * @returns The final agent state containing generated files and summary.
   */
  runAgentLoop(
    config: AIModelConfig,
    systemPrompt: string,
    userPrompt: string,
    tools: AgentTool[],
    maxIterations: number,
  ): Promise<AgentRunResult>;
}
