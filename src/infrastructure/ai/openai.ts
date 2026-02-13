/**
 * @file infrastructure/ai/openai.ts
 * @description OpenAI direct implementation of the AIProvider interface.
 *
 * STUB — this file provides the structure for using the OpenAI API directly
 * (without OpenRouter as a proxy). Replace the TODO implementation when
 * switching from OpenRouter to direct OpenAI access.
 */

import type { AIProvider, AIModelConfig, AgentRunResult } from "@/services/ai";

/**
 * AI provider that calls the OpenAI API directly.
 *
 * To use this provider, update the central wiring in
 * `src/infrastructure/index.ts` to instantiate `OpenAIDirectProvider`
 * instead of `OpenRouterProvider`.
 */
export class OpenAIDirectProvider implements AIProvider {
  async runAgentLoop(
    _config: AIModelConfig,
    _systemPrompt: string,
    _userPrompt: string,
    _tools: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
      handler: (args: Record<string, unknown>) => Promise<unknown>;
    }>,
    _maxIterations: number,
  ): Promise<AgentRunResult> {
    // TODO: Implement using OpenAI SDK directly
    // import OpenAI from "openai";
    // const client = new OpenAI({ apiKey: config.apiKey });
    // Run a tool-calling loop with client.chat.completions.create()
    throw new Error("OpenAIDirectProvider.runAgentLoop() not implemented yet");
  }
}
