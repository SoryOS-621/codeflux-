/**
 * @file core/agent/aiLoop.ts
 * @description The core AI agent loop — pure orchestration logic.
 *
 * This module contains ALL the business logic for running the AI developer
 * agent. It is completely decoupled from any specific provider:
 * - No Inngest imports
 * - No E2B imports
 * - No OpenRouter imports
 * - No Prisma imports
 *
 * All external systems are accessed through the `AgentDependencies` interface,
 * which is injected at call time from the infrastructure layer.
 */

import type { AgentDependencies, CodeAgentState } from "./types";
import { sanitizeShellCommand } from "./helpers";

// ---------------------------------------------------------------------------
// Helper: extract code blocks from text responses
// ---------------------------------------------------------------------------

/**
 * Extracts file paths and code contents from the agent's text response.
 *
 * When a weaker model writes code as plain text instead of calling
 * createOrUpdateFiles, this function salvages the code so the files can
 * still be written to the sandbox.
 *
 * Uses 3 strategies:
 * 1. JSON tool-call blocks (model writes tool call as JSON code block)
 * 2. Inline JSON without code fences
 * 3. Markdown-style code blocks with file paths
 */
export function extractCodeBlocksFromText(text: string): Record<string, string> {
  const files: Record<string, string> = {};

  // ── Strategy 1: JSON tool-call blocks ─────────────────────────────
  const jsonBlockRegex = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let jsonMatch;
  while ((jsonMatch = jsonBlockRegex.exec(text)) !== null) {
    const blockContent = jsonMatch[1].trim();
    if (blockContent.includes("createOrUpdateFiles")) {
      try {
        const parsed = JSON.parse(blockContent);
        const filesArray =
          parsed?.parameters?.files ||
          parsed?.arguments?.files ||
          parsed?.files;
        if (Array.isArray(filesArray)) {
          for (const f of filesArray) {
            if (f.path && f.content) {
              const filePath = f.path.replace(/^\/home\/user\//, "").replace(/^\/+/, "");
              files[filePath] = f.content;
            }
          }
        }
      } catch {
        // Not valid JSON — fall through
      }
    }
  }
  if (Object.keys(files).length > 0) return files;

  // ── Strategy 2: Inline JSON in plain text ─────────────────────────
  const inlineJsonRegex = /\{[\s\S]*?"createOrUpdateFiles"[\s\S]*?"files"\s*:\s*\[[\s\S]*?\]\s*\}/g;
  let inlineMatch;
  while ((inlineMatch = inlineJsonRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(inlineMatch[0]);
      const filesArray =
        parsed?.parameters?.files ||
        parsed?.arguments?.files ||
        parsed?.files;
      if (Array.isArray(filesArray)) {
        for (const f of filesArray) {
          if (f.path && f.content) {
            const filePath = f.path.replace(/^\/home\/user\//, "").replace(/^\/+/, "");
            files[filePath] = f.content;
          }
        }
      }
    } catch {
      // continue
    }
  }
  if (Object.keys(files).length > 0) return files;

  // ── Strategy 3: Markdown-style code blocks with file paths ────────
  const blockRegex = /(?:(?:\*\*|`)?([a-zA-Z0-9_/.@-]+\.(?:tsx?|jsx?|css|json|md))(?:\*\*|`)?\s*\n)?```(?:tsx?|jsx?|typescript|javascript|json|css|html)?\s*\n([\s\S]*?)```/g;

  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    let filePath = match[1]?.trim();
    let code = match[2];

    if (!code || code.trim().length === 0) continue;

    if (!filePath) {
      const firstLine = code.split("\n")[0].trim();
      const commentPathMatch = firstLine.match(
        /^(?:\/\/|\/\*|#)\s*([a-zA-Z0-9_/.@-]+\.(?:tsx?|jsx?|css|json|md))/
      );
      if (commentPathMatch) {
        filePath = commentPathMatch[1];
        code = code.split("\n").slice(1).join("\n");
      }
    }

    if (!filePath) continue;
    filePath = filePath.replace(/^\/home\/user\//, "").replace(/^\/+/, "");
    files[filePath] = code.trimEnd() + "\n";
  }

  return files;
}

// ---------------------------------------------------------------------------
// Tool Builder
// ---------------------------------------------------------------------------

/**
 * Build the tool definitions that the AI agent will use.
 *
 * Each tool delegates to the injected sandbox provider — the core layer
 * never knows whether it's talking to E2B, Docker, or a mock.
 *
 * @param sandboxId - The active sandbox ID.
 * @param deps      - Injected dependencies.
 * @param state     - Mutable shared state across iterations.
 * @returns Array of tool definitions for the AI provider.
 */
export function buildAgentTools(
  sandboxId: string,
  deps: AgentDependencies,
  state: CodeAgentState,
) {
  return [
    {
      name: "terminal",
      description:
        "Execute a shell command in the sandbox. Use for package installs " +
        "(npm install <pkg> --yes) and file system exploration (ls, find, tree). " +
        "Returns JSON with stdout, stderr, and exitCode so you can see real errors.",
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
          // Return both stdout and stderr so agent can see warnings/errors
          return JSON.stringify({
            stdout: result.stdout || "",
            stderr: result.stderr || "",
            exitCode: result.exitCode ?? 0,
          });
        } catch (error) {
          // Return the real error to the agent instead of swallowing it
          return JSON.stringify({
            stdout: "",
            stderr: String(error),
            exitCode: 1,
            error: String(error),
          });
        }
      },
    },
    {
      name: "getDevServerLogs",
      description:
        "Check the Next.js dev server for compilation or runtime errors. " +
        "Fetches sandbox system logs (ERROR/WARN), checks localhost:3000 for the " +
        "Next.js error overlay, and runs a TypeScript check to catch type errors. " +
        "Call this after writing/updating files to verify they compile cleanly.",
      parameters: {
        type: "object" as const,
        properties: {},
        required: [],
      },
      handler: async (_args: Record<string, unknown>) => {
        const logs: Record<string, string> = {};

        // 1. Fetch E2B sandbox system logs (captures dev server stdout/stderr)
        try {
          const sandboxLogs = await deps.getSandboxLogs(sandboxId, { limit: 100 });
          const errorLogs = sandboxLogs.filter(
            (l) => l.level === "ERROR" || l.level === "WARN",
          );
          if (errorLogs.length > 0) {
            logs.sandboxErrors = errorLogs
              .map((l) => `[${l.level}] ${l.message}`)
              .join("\n");
          }
        } catch (error) {
          logs.sandboxLogsError = String(error);
        }

        // 2. Check the page response for Next.js error overlay
        try {
          const curlResult = await deps.executeSandboxCommand(
            sandboxId,
            "curl -s -o /tmp/page_check.html -w '%{http_code}' http://localhost:3000 2>&1"
          );
          const httpStatus = curlResult.stdout.trim();
          logs.httpStatus = httpStatus;

          if (httpStatus !== "200") {
            try {
              const errorPage = await deps.executeSandboxCommand(
                sandboxId,
                "cat /tmp/page_check.html | head -200"
              );
              logs.errorPageContent = errorPage.stdout;
            } catch {
              logs.errorPageContent = "Could not read error page";
            }
          }
        } catch (error) {
          logs.curlError = String(error);
        }

        // 3. Check for TypeScript / Next.js compilation errors via tsc
        try {
          const tscResult = await deps.executeSandboxCommand(
            sandboxId,
            "cd /home/user && npx tsc --noEmit --pretty 2>&1 | tail -80"
          );
          const tscOutput = tscResult.stdout.trim();
          if (tscOutput) {
            logs.typescriptErrors = tscOutput;
          }
        } catch (error) {
          logs.typescriptCheck = String(error);
        }

        // Store errors in shared state so lifecycle can block completion
        const hasErrors = logs.sandboxErrors ||
          logs.typescriptErrors ||
          logs.errorPageContent ||
          (logs.httpStatus && logs.httpStatus !== "200");

        if (hasErrors) {
          state.lastErrors = JSON.stringify(logs);
        } else {
          state.lastErrors = "";
        }

        return JSON.stringify(logs, null, 2);
      },
    },
    {
      name: "createOrUpdateFiles",
      description:
        "Create or overwrite files in the sandbox. Paths must be relative " +
        "(e.g. 'app/page.tsx'). Batch multiple files in a single call when possible.",
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
          // Return real error details so the agent can act on them
          const errMsg = error instanceof Error
            ? `${error.name}: ${error.message}\n${error.stack ?? ""}`
            : String(error);
          return `File write failed — ${errMsg}`;
        }
      },
    },
    {
      name: "readFiles",
      description:
        "Read file contents from the sandbox. Provide absolute paths " +
        "(e.g. '/home/user/app/page.tsx'). Use terminal to discover paths first.",
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
          // Return real error so the agent can see what happened
          const errMsg = error instanceof Error
            ? `${error.name}: ${error.message}`
            : String(error);
          return JSON.stringify({ error: errMsg });
        }
      },
    },
  ];
}

/**
 * Check whether the agent's response contains a `<task_summary>` block,
 * indicating that it considers the task complete.
 *
 * @param content - The assistant's text response.
 * @returns The full content if it contains a summary, or empty string.
 */
export function detectSummary(content: string): string {
  if (content.includes("<task_summary>")) {
    return content;
  }
  return "";
}
