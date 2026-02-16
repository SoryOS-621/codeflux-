/**
 * @file core/agents/coder.ts
 * @description CoderAgent — generates code files based on a structured plan.
 *
 * The CoderAgent is the primary code generation agent. It receives a plan
 * from the PlannerAgent and uses the AI agent loop (with tools: terminal,
 * createOrUpdateFiles, readFiles) to implement the plan in the sandbox.
 *
 * This agent reuses the existing `buildAgentTools()` function from aiLoop.ts,
 * preserving backward compatibility with the current tool definitions.
 */

import { BaseAgent } from "./base";
import type { AgentContext, CoderInput, CoderOutput } from "./types";
import type { CodeAgentState } from "@/types";
import { buildAgentTools, detectSummary } from "@/core/agent/aiLoop";
import { AGENT_SYSTEM_PROMPT } from "@/core/agent/system-prompt";

/** Maximum AI iterations for code generation (non-template). */
const MAX_CODER_ITERATIONS = 30;

/** Maximum AI iterations for template customization. */
const MAX_TEMPLATE_ITERATIONS = 8;

/**
 * Focused system prompt for template customization.
 * Much shorter than the full system prompt — keeps token usage low
 * on free models and tells the AI to finish quickly.
 */
const TEMPLATE_SYSTEM_PROMPT = `
You are a senior software engineer CUSTOMIZING an existing Next.js 15 project.

The template files are ALREADY written and functional. Your ONLY job is to
customize text, colors, icons, and content to match the user's request.

Rules:
- Use readFiles to see current content, then createOrUpdateFiles to modify.
- Keep ALL existing component structure — only change text/data/colors.
- Use Tailwind CSS classes only (no CSS files).
- Shadcn components are at "@/components/ui/*" (already installed).
- Lucide icons from "lucide-react".
- Do NOT run npm run dev/build/start — the dev server is already running.
- Complete your work in 3–5 tool calls. Do NOT explore unnecessarily.
- All file paths must be relative (e.g. "app/page.tsx").
- When reading files, use absolute paths: "/home/user/app/page.tsx".

After ALL tool calls are done, respond with:
<task_summary>
Short summary of what was customized.
</task_summary>
`;

export class CoderAgent extends BaseAgent<CoderInput, CoderOutput> {
  readonly name = "CoderAgent";

  async execute(
    input: CoderInput,
    context: AgentContext,
  ): Promise<CoderOutput> {
    // Emit code_generation_started
    this.emit(context, "code_generation_started", {
      currentStep: input.plan.steps[0] ?? "Implementation",
    });
    this.emitStatus(context, "Starting code generation...");

    // Build the shared state and tools (reuses existing aiLoop.ts logic)
    const state: CodeAgentState = {
      summary: "",
      files: {},
    };

    // Build tools with event-emitting wrappers
    const baseTools = buildAgentTools(context.sandboxId, context.deps, state);

    // Wrap the createOrUpdateFiles tool to emit files_written events
    const tools = baseTools.map((tool) => {
      if (tool.name === "createOrUpdateFiles") {
        const originalHandler = tool.handler;
        return {
          ...tool,
          handler: async (args: Record<string, unknown>) => {
            const result = await originalHandler(args);

            // Emit files_written event with CONTENTS after successful write
            const files = args.files as
              | Array<{ path: string; content: string }>
              | undefined;
            if (
              files &&
              typeof result === "string" &&
              !String(result).startsWith("Error")
            ) {
              // Build path→content map for real-time editor updates
              const fileContents: Record<string, string> = {};
              for (const f of files) {
                fileContents[f.path] = f.content;
              }

              this.emit(context, "files_written", {
                paths: files.map((f) => f.path),
                totalFiles: Object.keys(state.files).length,
                files: fileContents,
              });

              // Emit a status update for each batch of files
              const fileList = files.map((f) => f.path).join(", ");
              this.emitStatus(
                context,
                `Created/updated: ${fileList}`,
              );
            }

            return result;
          },
        };
      }

      if (tool.name === "terminal") {
        const originalHandler = tool.handler;
        return {
          ...tool,
          handler: async (args: Record<string, unknown>) => {
            const command = args.command as string;

            // Emit terminal_command so user sees exactly what command is running
            this.emit(context, "terminal_command", {
              command,
              agent: this.name,
            });

            // Emit status for notable terminal commands
            if (command.startsWith("npm install")) {
              this.emitStatus(
                context,
                `Installing: ${command.replace("npm install ", "").replace(" --yes", "")}`,
              );
            } else {
              this.emitStatus(
                context,
                `Running: ${command.length > 60 ? command.slice(0, 60) + "..." : command}`,
              );
            }

            const result = await originalHandler(args);

            // Stream terminal output as log events
            if (typeof result === "string" && result.length > 0) {
              // Split long output into chunks for streaming
              const lines = result.split("\n");
              let chunk = "";
              for (const line of lines) {
                if (chunk.length + line.length + 1 > 1500) {
                  this.emit(context, "log_stream", {
                    source: "stdout" as const,
                    chunk,
                  });
                  chunk = "";
                }
                chunk += (chunk ? "\n" : "") + line;
              }
              if (chunk) {
                this.emit(context, "log_stream", {
                  source: "stdout" as const,
                  chunk,
                });
              }
            }

            return result;
          },
        };
      }

      return tool;
    });

    // Compose the prompt with the plan context
    const enhancedPrompt = this.buildPromptWithPlan(input, context);

    // Use lighter system prompt + fewer iterations for template projects
    const isTemplate = !!context.template;
    const systemPrompt = isTemplate ? TEMPLATE_SYSTEM_PROMPT : AGENT_SYSTEM_PROMPT;
    const maxIter = input.maxIterations ?? (isTemplate ? MAX_TEMPLATE_ITERATIONS : MAX_CODER_ITERATIONS);

    this.log(
      `Starting AI loop: maxIterations=${maxIter}, template=${isTemplate}`,
    );

    // Run the AI agent loop
    try {
      const agentResult = await context.aiProvider.runAgentLoop(
        context.aiConfig,
        systemPrompt,
        enhancedPrompt,
        tools,
        maxIter,
        {
          agentName: "coder-agent",
          onIteration: (current, max) => {
            this.emitStatus(
              context,
              `AI iteration ${current}/${max}...`,
            );
          },
        },
      );

      // Transfer state from agent result
      if (agentResult.state.summary) {
        state.summary = agentResult.state.summary;
      }
      if (
        agentResult.state.files &&
        Object.keys(agentResult.state.files).length > 0
      ) {
        state.files = { ...state.files, ...agentResult.state.files };
      }

      this.log(
        `Code generation complete: ${Object.keys(state.files).length} files, ${agentResult.iterationCount} iterations`,
      );

      // Detect summary from content
      const summary = state.summary || detectSummary(state.summary) || "";

      return {
        files: state.files,
        summary,
      };
    } catch (error) {
      this.logError("Code generation failed", error);
      throw error; // Let the orchestrator handle this
    }
  }

  /**
   * Build an enhanced prompt that includes the plan context.
   * When a template is active, prepends the customization instructions.
   */
  private buildPromptWithPlan(input: CoderInput, context?: AgentContext): string {
    const sections: string[] = [];

    // If a template is active, prepend the customization prompt
    if (context?.template) {
      sections.push(
        "## Template Already Applied",
        "",
        context.template.customizationPrompt,
        "",
        "---",
        "",
      );
    }

    // User prompt
    sections.push(input.prompt);

    // Plan context
    const planSection = [
      "",
      "## Implementation Plan",
      "",
      `**Description:** ${input.plan.description}`,
      "",
      "**Steps:**",
      ...input.plan.steps.map((s, i) => `${i + 1}. ${s}`),
      "",
      "**Files to create:**",
      ...input.plan.filesToCreate.map((f) => `- ${f}`),
    ];

    if (input.plan.dependenciesToInstall.length > 0) {
      planSection.push(
        "",
        "**Dependencies to install first:**",
        ...input.plan.dependenciesToInstall.map((d) => `- ${d}`),
      );
    }

    sections.push(planSection.join("\n"));

    return sections.join("\n");
  }
}
