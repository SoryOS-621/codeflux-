/**
 * @file core/agents/debugger.ts
 * @description DebuggerAgent — analyzes build errors and produces fixes.
 *
 * When the BuildAgent reports a failure, the DebuggerAgent is invoked
 * to analyze the error output, determine the cause, and apply fixes
 * using the sandbox tools (createOrUpdateFiles, terminal).
 *
 * The DebuggerAgent uses the AI with tools to:
 * 1. Read the failing files
 * 2. Analyze the error message
 * 3. Write corrected files
 * 4. Install missing dependencies if needed
 */

import { BaseAgent } from "./base";
import type { AgentContext, DebuggerInput, DebuggerOutput } from "./types";
import type { CodeAgentState } from "@/types";
import { buildAgentTools } from "@/core/agent/aiLoop";

/** Maximum iterations for a single debug cycle. */
const MAX_DEBUG_ITERATIONS = 10;

/** System prompt for the debugger — focused on fixing build errors. */
const DEBUGGER_SYSTEM_PROMPT = `You are an expert TypeScript/Next.js debugger. Your ONLY job is to fix build errors.

You are given:
1. An error message from a failed build (npx tsc --noEmit)
2. Access to read files, modify files, and run terminal commands in the sandbox

Rules:
- Focus ONLY on fixing the reported errors — do not refactor or add features
- Read the failing files first to understand context
- Make minimal, targeted changes to fix the error
- If a dependency is missing, install it with "npm install <package> --yes"
- If a type is wrong, fix the type — don't suppress with @ts-ignore
- Do NOT modify layout.tsx
- All file paths must be relative (e.g. "app/page.tsx")
- After applying your fix, respond with a <task_summary> describing what you fixed

Final output (MANDATORY):
After fixing the error, respond with exactly:

<task_summary>
Description of what was fixed.
</task_summary>`;

export class DebuggerAgent extends BaseAgent<DebuggerInput, DebuggerOutput> {
  readonly name = "DebuggerAgent";

  async execute(
    input: DebuggerInput,
    context: AgentContext,
  ): Promise<DebuggerOutput> {
    // Emit debug_started
    this.emit(context, "debug_started", {
      error: input.error.slice(0, 500),
      attempt: input.attempt,
    });
    this.emitStatus(
      context,
      `Analyzing build error (attempt ${input.attempt})...`,
    );

    // Build tools — track which files get modified
    const state: CodeAgentState = {
      summary: "",
      files: {},
    };

    const baseTools = buildAgentTools(context.sandboxId, context.deps, state);

    // Wrap createOrUpdateFiles to track modifications
    const filesModified: string[] = [];
    const tools = baseTools.map((tool) => {
      if (tool.name === "createOrUpdateFiles") {
        const originalHandler = tool.handler;
        return {
          ...tool,
          handler: async (args: Record<string, unknown>) => {
            const result = await originalHandler(args);
            const files = args.files as
              | Array<{ path: string; content: string }>
              | undefined;
            if (
              files &&
              typeof result === "string" &&
              !String(result).startsWith("Error")
            ) {
              for (const f of files) {
                if (!filesModified.includes(f.path)) {
                  filesModified.push(f.path);
                }
              }
              this.emitStatus(
                context,
                `Fixed: ${files.map((f) => f.path).join(", ")}`,
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
            if (command.startsWith("npm install")) {
              this.emitStatus(
                context,
                `Installing missing dependency: ${command.replace("npm install ", "").replace(" --yes", "")}`,
              );
            }
            return originalHandler(args);
          },
        };
      }

      return tool;
    });

    // Compose the debug prompt with the error context
    const debugPrompt = this.buildDebugPrompt(input);

    try {
      const agentResult = await context.aiProvider.runAgentLoop(
        context.aiConfig,
        DEBUGGER_SYSTEM_PROMPT,
        debugPrompt,
        tools,
        MAX_DEBUG_ITERATIONS,
        { agentName: "debugger-agent" },
      );

      // Merge any newly written files into the state
      if (
        agentResult.state.files &&
        Object.keys(agentResult.state.files).length > 0
      ) {
        Object.assign(state.files, agentResult.state.files);
      }

      const description =
        agentResult.state.summary ||
        `Fixed ${filesModified.length} file(s): ${filesModified.join(", ")}`;

      // Emit fix_applied
      this.emit(context, "fix_applied", {
        filesModified,
        description,
      });
      this.emitStatus(context, `Fix applied: ${description.slice(0, 200)}`);

      this.log(
        `Debug complete: modified ${filesModified.length} files in ${agentResult.iterationCount} iterations`,
      );

      return {
        filesModified,
        description,
      };
    } catch (error) {
      this.logError("Debug cycle failed", error);

      // Even if AI fails, report what we know
      return {
        filesModified,
        description: `Debug attempt failed: ${String(error).slice(0, 200)}`,
      };
    }
  }

  /**
   * Build the prompt that gives the debugger the error context.
   */
  private buildDebugPrompt(input: DebuggerInput): string {
    return [
      "## Build Error to Fix",
      "",
      "The following TypeScript build error occurred:",
      "",
      "```",
      input.error.slice(0, 3000), // Cap error output at 3KB
      "```",
      "",
      `This is attempt ${input.attempt} to fix this error.`,
      "",
      "Please:",
      "1. Read the failing file(s) mentioned in the error",
      "2. Identify the root cause",
      "3. Apply the minimal fix using createOrUpdateFiles",
      "4. If a package is missing, install it via terminal",
    ].join("\n");
  }
}
