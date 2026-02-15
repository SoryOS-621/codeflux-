/**
@file core/agent/aiLoop.ts
@description The core AI agent loop — pure orchestration logic.

This module contains ALL the business logic for running the AI developer
agent. It is completely decoupled from any specific provider:
 - No Inngest imports
 - No E2B imports
 - No OpenRouter imports
 - No Prisma imports

  All external systems are accessed through the `AgentDependencies` interface,
  which is injected at call time from the infrastructure layer.
 */

import type { AgentDependencies, CodeAgentState } from "./types";
import { sanitizeShellCommand } from "./helpers";

/**
 Build the tool definitions that the AI agent will use.

 Each tool delegates to the injected sandbox provider — the core layer
 never knows whether it's talking to E2B, Docker, or a mock.

 @param sandboxId - The active sandbox ID.
 @param deps      - Injected dependencies.
 @param state     - Mutable shared state across iterations.
 @returns Array of tool definitions for the AI provider.
**/
export function buildAgentTools(
  sandboxId: string,
  deps: AgentDependencies,
  state: CodeAgentState,
) {
  return [
    {
      name: "terminal",
      description:
        "Run shell commands for inspection and installs. Always limit output size. " +
        "Use commands like: ls | head, ls app, find app -maxdepth 2, or tree -L 2. " +
        "Never run plain ls on large folders like node_modules.",
      parameters: {
        type: "object" as const,
        properties: {
          command: { type: "string" as const },
        },
        required: ["command"],
      },
      handler: async (args: Record<string, unknown>) => {
        const command = args.command as string;
        const safeCommand = sanitizeShellCommand(command);
        try {
          const result = await deps.executeSandboxCommand(sandboxId, safeCommand);
          return result.stdout;
        } catch (error) {
          console.log(`[terminal] Command failed: ${error}`);
          return `Error: ${error}`;
        }
      },
    },
    {
      name: "createOrUpdateFiles",
      description:
        "Create or update files in the sandbox. Use this for ALL code and content " +
        "changes. Each path must be relative. Do NOT use absolute paths. " +
        "Do NOT paste full files in chat—apply changes through this tool.",
      parameters: {
        type: "object" as const,
        properties: {
          files: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                path: { type: "string" as const },
                content: { type: "string" as const },
              },
              required: ["path", "content"],
            },
          },
        },
        required: ["files"],
      },
      handler: async (args: Record<string, unknown>) => {
        const files = args.files as Array<{ path: string; content: string }>;
        try {
          await deps.writeSandboxFiles(sandboxId, files);

          // Merge with any files already written in previous iterations
          for (const file of files) {
            state.files[file.path] = file.content;
          }

          return "Files written successfully.";
        } catch (error) {
          return `Error: ${error}`;
        }
      },
    },
    {
      name: "readFiles",
      description:
        "Read the contents of existing files in the sandbox. Use this ONLY for " +
        "real files with known paths. Do NOT use on folders. Use terminal (ls, find) " +
        "to explore directories first.",
      parameters: {
        type: "object" as const,
        properties: {
          files: {
            type: "array" as const,
            items: { type: "string" as const },
          },
        },
        required: ["files"],
      },
      handler: async (args: Record<string, unknown>) => {
        const filePaths = args.files as string[];
        try {
          const contents = await deps.readSandboxFiles(sandboxId, filePaths);
          return JSON.stringify(contents);
        } catch (error) {
          return `Error: ${error}`;
        }
      },
    },
  ];
}

/** 
  Check whether the agent's response contains a `<task_summary>` block,
  indicating that it considers the task complete.
 
  @param content - The assistant's text response.
  @returns The full content if it contains a summary, or empty string.
 */
export function detectSummary(content: string): string {
  if (content.includes("<task_summary>")) {
    return content;
  }
  return "";
}
