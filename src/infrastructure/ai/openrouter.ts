/**
 * @file infrastructure/ai/openrouter.ts
 * @description OpenRouter (via Inngest Agent Kit) implementation of the AIProvider interface.
 *
 * This is the ONLY file that imports `@inngest/agent-kit` for AI model access.
 * It wraps the Inngest Agent Kit's agent/network system to satisfy the
 * provider-agnostic AIProvider interface.
 */

import type { AIProvider, AIModelConfig, AgentRunResult } from "@/services/ai";
import type { CodeAgentState } from "@/types";
import { extractCodeBlocksFromText } from "@/core/agent/aiLoop";
import {
  openai,
  createAgent,
  createTool,
  createNetwork,
} from "@inngest/agent-kit";
import type { AgentResult, TextMessage } from "@inngest/agent-kit";
import z from "zod";
import type { ZodTypeAny } from "zod";

/**
 * Converts a simple JSON Schema object (as used by our tool definitions)
 * into an equivalent Zod schema so the Agent Kit sends a fully typed
 * `parameters` block to the model — preventing it from hallucinating
 * wrong parameter names (e.g. `cmd` instead of `command`).
 *
 * Supports: string, number, boolean, array (with items), and object
 * (with properties + required). Falls back to `z.any()` for unknown types.
 */
function jsonSchemaToZod(schema: Record<string, unknown>): ZodTypeAny {
  const type = schema.type as string | undefined;

  switch (type) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();

    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      return z.array(items ? jsonSchemaToZod(items) : z.any());
    }

    case "object": {
      const properties = schema.properties as
        | Record<string, Record<string, unknown>>
        | undefined;
      const required = (schema.required as string[]) || [];

      if (!properties) return z.object({});

      const shape: Record<string, ZodTypeAny> = {};
      for (const [key, propSchema] of Object.entries(properties)) {
        const zodProp = jsonSchemaToZod(propSchema);
        shape[key] = required.includes(key) ? zodProp : zodProp.optional();
      }
      return z.object(shape);
    }

    default:
      return z.any();
  }
}

/**
 * Extracts the text content from the last assistant message in an
 * agent result's output array.
 */
function extractLastAssistantMessage(result: AgentResult): string | undefined {
  const lastAssistantIndex = result.output.findLastIndex(
    (message) => message.role === "assistant",
  );

  const message = result.output[lastAssistantIndex] as
    | TextMessage
    | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
}

/**
 * AI provider that uses OpenRouter via the Inngest Agent Kit.
 *
 * Despite using Inngest Agent Kit for the agent loop, this is NOT
 * an Inngest queue integration — it's purely using the AI agent
 * orchestration utilities from the agent-kit package.
 */
export class OpenRouterProvider implements AIProvider {
  async runAgentLoop(
    config: AIModelConfig,
    systemPrompt: string,
    userPrompt: string,
    tools: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
      handler: (args: Record<string, unknown>) => Promise<unknown>;
    }>,
    maxIterations: number,
  ): Promise<AgentRunResult> {
    // Convert our generic tool definitions to Inngest Agent Kit tools.
    // We convert the raw JSON Schema parameter objects into Zod schemas so
    // the model receives a fully typed function signature — preventing it
    // from hallucinating wrong parameter names/formats.
    const agentKitTools = tools.map((tool) =>
      createTool({
        name: tool.name,
        description: tool.description,
        parameters: jsonSchemaToZod(tool.parameters),
        handler: async (args: unknown, opts: Record<string, unknown>) => {
          // Wrap in step.run() so each tool invocation appears as a
          // visible sub-step in the Inngest dev server.
          const step = opts?.step as
            | { run: (id: string, fn: () => Promise<unknown>) => Promise<unknown> }
            | undefined;
          const network = opts?.network as
            | { state: { data: CodeAgentState } }
            | undefined;

          let result: unknown;
          if (step?.run) {
            result = await step.run(tool.name, async () => {
              return await tool.handler(args as Record<string, unknown>);
            });
          } else {
            result = await tool.handler(args as Record<string, unknown>);
          }

          // ── Track getDevServerLogs calls ────────────────────────────
          if (tool.name === "getDevServerLogs" && network) {
            network.state.data.devLogsChecked = true;
          }

          // ── Replay-safe file tracking ──────────────────────────────
          // Inngest replays the function from scratch after each step
          // checkpoint. Side-effects inside step.run() (like writing to
          // a local `state.files` object) do NOT re-run on replay — only
          // the memoized return value is used.
          //
          // To ensure the file list survives replay, we accumulate
          // written files into the Agent Kit's **network state**, which
          // IS serialized and restored across replays. The file data
          // comes from the original tool args (preserved in the memoized
          // step.ai.infer result), so it's available on every invocation.
          if (
            tool.name === "createOrUpdateFiles" &&
            network &&
            typeof result === "string" &&
            !result.startsWith("Error")
          ) {
            const typedArgs = args as {
              files?: Array<{ path: string; content: string }>;
            };
            if (typedArgs.files) {
              if (!network.state.data.files) {
                network.state.data.files = {};
              }
              for (const file of typedArgs.files) {
                network.state.data.files[file.path] = file.content;
              }
            }
          }

          return result;
        },
      }),
    );

    const codeAgent = createAgent<CodeAgentState>({
      name: "code-agent",
      description: "An experienced software development engineer.",
      system: systemPrompt,
      model: openai({
        model: config.model,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        defaultParameters: {
          temperature: config.temperature ?? 0.1,
        },
      }),
      tools: agentKitTools,
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const assistantMessage = extractLastAssistantMessage(result);

          if (assistantMessage && network) {
            // ── Fallback: extract code/files from text responses ───────
            // Some models write code as markdown text or embed tool calls
            // as JSON instead of making real function calls.
            const hasFiles = Object.keys(network.state.data.files || {}).length > 0;
            if (!hasFiles && (
              assistantMessage.includes("```") ||
              assistantMessage.includes("createOrUpdateFiles")
            )) {
              const extracted = extractCodeBlocksFromText(assistantMessage);
              if (Object.keys(extracted).length > 0) {
                console.log(
                  `[CodeFlux] Model wrote code as text instead of using tool. ` +
                  `Extracting ${Object.keys(extracted).length} file(s) and writing to sandbox.`
                );
                // Write them via the createOrUpdateFiles tool handler
                const createTool = tools.find(t => t.name === "createOrUpdateFiles");
                if (createTool) {
                  const filesToWrite = Object.entries(extracted).map(([path, content]) => ({ path, content }));
                  try {
                    await createTool.handler({ files: filesToWrite });
                  } catch (err) {
                    console.error("[CodeFlux] Failed to write extracted files:", err);
                  }
                }
              }
            }

            // ── Check if the agent wants to finish ────────────────────
            if (assistantMessage.includes("<task_summary>")) {
              const filesNow = Object.keys(network.state.data.files || {}).length;

              if (filesNow === 0) {
                // Agent produced a summary but never wrote any files — reject
                console.log(
                  "[CodeFlux] Agent tried to finish without writing any files. Re-iterating."
                );
                result.output.push({
                  type: "text" as const,
                  role: "user" as const,
                  content:
                    "ERROR: You produced a <task_summary> but did NOT write any files to the sandbox. " +
                    "Your code was only in plain text. You MUST call the createOrUpdateFiles tool to " +
                    "actually write the files. Please use createOrUpdateFiles now with all the code you intended to write, " +
                    "then call getDevServerLogs to verify, then produce <task_summary> again.",
                });
                // Don't set summary — agent will re-iterate
              } else if (!network.state.data.devLogsChecked) {
                console.log(
                  "[CodeFlux] Agent tried to finish without calling getDevServerLogs. Rejecting."
                );
                result.output.push({
                  type: "text" as const,
                  role: "user" as const,
                  content:
                    "ERROR: You MUST call getDevServerLogs at least once to verify your code compiles " +
                    "before producing <task_summary>. Call getDevServerLogs now, fix any errors, " +
                    "then produce <task_summary> again.",
                });
              } else if (network.state.data.lastErrors) {
                console.log(
                  "[CodeFlux] Agent tried to finish but there are outstanding errors. " +
                  "Clearing summary so agent can fix them."
                );
                result.output.push({
                  type: "text" as const,
                  role: "user" as const,
                  content:
                    "ERROR: There are still compilation errors. Fix them before producing <task_summary>. " +
                    "Errors: " + network.state.data.lastErrors,
                });
                // Don't set summary — agent will re-iterate
              } else {
                network.state.data.summary = assistantMessage;
              }
            }
          }

          return result;
        },
      },
    });

    const agentNetwork = createNetwork<CodeAgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: maxIterations,
      router: async ({ network }) => {
        if (network.state.data.summary) return;
        return codeAgent;
      },
    });

    // The Agent Kit reuses the agent name as the Inngest step ID on each
    // loop iteration, which produces an AUTOMATIC_PARALLEL_INDEXING warning.
    // This is harmless — Inngest auto-indexes the duplicate IDs (:0, :1, …)
    // and the function runs correctly. Keeping the Inngest context intact
    // preserves full step-level tracing in the dev server.
    const networkResult = await agentNetwork.run(userPrompt);

    return {
      state: {
        summary: networkResult.state.data.summary || "",
        files: networkResult.state.data.files || {},
        lastErrors: networkResult.state.data.lastErrors || "",
        devLogsChecked: networkResult.state.data.devLogsChecked || false,
      },
      iterationCount: networkResult.state.results.length,
    };
  }
}
