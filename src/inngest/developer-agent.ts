/**
 * @file developer-agent.ts
 * @description The core AI code-generation agent powered by Inngest + E2B.
 *
 * ## What this file does
 * 1. Listens for the `"app/developer.generate"` Inngest event
 * 2. Spins up a cloud sandbox (E2B) with a pre-configured Next.js environment
 * 3. Creates an AI agent with three tools: terminal, createOrUpdateFiles, readFiles
 * 4. Runs the agent in a loop (up to 30 iterations) until it produces a `<task_summary>`
 * 5. Saves the result (or error) to the database as a Message + Fragment
 *
 * ## Key concepts
 * - **CodeAgentState**: Shared state that accumulates across agent iterations
 *   (the generated files map and the final summary).
 * - **sanitizeShellCommand()**: Rewrites shell commands to always exclude
 *   `node_modules` from directory listings, preventing the agent from
 *   wasting tokens on massive output.
 * - **Error handling**: Upstream AI errors (rate limits, bad JSON, auth failures)
 *   are caught and saved as ERROR-type messages so the UI can display them.
 */

import "dotenv/config";
import { Sandbox } from "@e2b/code-interpreter";
import z from "zod";
import { inngest } from "./client";
import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  Tool,
} from "@inngest/agent-kit";
import { connectToSandbox, extractLastAssistantMessage } from "./sandbox-helpers";
import { AGENT_SYSTEM_PROMPT } from "./agent-system-prompt";
import prisma from "@/lib/prisma-client";

// ---------------------------------------------------------------------------
// Helper: sanitize shell commands
// ---------------------------------------------------------------------------

/**
 * Rewrites directory-listing shell commands (ls, find, tree, du) so that
 * `node_modules` is always excluded at the shell level.
 *
 * Without this, the AI agent might run `ls` or `tree` on the project root
 * and receive hundreds of thousands of lines of output from node_modules,
 * which wastes tokens and confuses the model.
 *
 * @param rawCommand - The original shell command string from the agent.
 * @returns The rewritten command with node_modules excluded.
 */
function sanitizeShellCommand(rawCommand: string): string {
  const segments = rawCommand.split("|");

  const rewritten = segments.map((seg) => {
    const trimmed = seg.trim();

    // ls — use --ignore flag so node_modules is never listed
    if (/^ls\b/.test(trimmed)) {
      if (!trimmed.includes("--ignore") || !trimmed.includes("node_modules")) {
        return ` ${trimmed} --ignore='node_modules'`;
      }
    }

    // find — use -prune so the directory is never descended into
    if (/^find\b/.test(trimmed) && !trimmed.includes("node_modules")) {
      const tokens = trimmed.split(/\s+/);
      const findCmd = tokens[0]; // "find"
      const findPath = tokens[1] || ".";
      const rest = tokens.slice(2).join(" ");
      return ` ${findCmd} ${findPath} -name 'node_modules' -prune -o ${rest || "-print"} ${rest ? "" : ""}`.replace(
        /\s+$/,
        "",
      );
    }

    // tree — use -I so node_modules is never traversed
    if (/^tree\b/.test(trimmed) && !trimmed.includes("node_modules")) {
      return ` ${trimmed} -I 'node_modules'`;
    }

    // du — use --exclude so node_modules is skipped entirely
    if (/^du\b/.test(trimmed) && !trimmed.includes("node_modules")) {
      return ` ${trimmed} --exclude='node_modules'`;
    }

    return seg;
  });

  return rewritten.join("|");
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Extracts file paths and code contents from markdown-style code blocks
 * in the agent's text response.
 *
 * When a weaker model writes code as plain text instead of calling
 * createOrUpdateFiles, this function salvages the code so the files can
 * still be written to the sandbox.
 *
 * Recognises patterns like:
 *   ```tsx
 *   // app/page.tsx
 *   export default function Page() { ... }
 *   ```
 * Or:
 *   **app/page.tsx**
 *   ```tsx
 *   export default function Page() { ... }
 *   ```
 */
function extractCodeBlocksFromText(text: string): Record<string, string> {
  const files: Record<string, string> = {};

  // ── Strategy 1: JSON tool-call blocks ─────────────────────────────
  // Some models write the tool call as a JSON code block instead of
  // making a real function call. Detect and parse these.
  // e.g. ```json\n{"type":"function","name":"createOrUpdateFiles","parameters":{"files":[...]}}```
  const jsonBlockRegex = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let jsonMatch;
  while ((jsonMatch = jsonBlockRegex.exec(text)) !== null) {
    const blockContent = jsonMatch[1].trim();
    // Only try parsing blocks that look like they contain createOrUpdateFiles
    if (blockContent.includes("createOrUpdateFiles")) {
      try {
        const parsed = JSON.parse(blockContent);
        // Handle: { "name": "createOrUpdateFiles", "parameters": { "files": [...] } }
        const filesArray =
          parsed?.parameters?.files ||
          parsed?.arguments?.files ||
          parsed?.files;
        if (Array.isArray(filesArray)) {
          for (const f of filesArray) {
            if (f.path && f.content) {
              let filePath = f.path.replace(/^\/home\/user\//, "").replace(/^\/+/, "");
              files[filePath] = f.content;
            }
          }
        }
      } catch {
        // Not valid JSON — fall through to Strategy 2
      }
    }
  }

  // If we already found files via JSON parsing, return early
  if (Object.keys(files).length > 0) return files;

  // ── Strategy 2: Inline JSON in plain text (no code fence) ─────────
  // Some models write the JSON without code fences at all
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
            let filePath = f.path.replace(/^\/home\/user\//, "").replace(/^\/+/, "");
            files[filePath] = f.content;
          }
        }
      }
    } catch {
      // Not valid JSON — continue
    }
  }

  if (Object.keys(files).length > 0) return files;

  // ── Strategy 3: Markdown-style code blocks with file paths ────────
  // e.g. **app/page.tsx**\n```tsx\n...\n```
  // or   ```tsx\n// app/page.tsx\n...\n```
  const blockRegex = /(?:(?:\*\*|`)?([a-zA-Z0-9_/.@-]+\.(?:tsx?|jsx?|css|json|md))(?:\*\*|`)?\s*\n)?```(?:tsx?|jsx?|typescript|javascript|json|css|html)?\s*\n([\s\S]*?)```/g;

  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    let filePath = match[1]?.trim();
    let code = match[2];

    if (!code || code.trim().length === 0) continue;

    // If path wasn't before the block, check the first line inside the block
    // e.g. "// app/page.tsx" or "/* app/components/header.tsx */"
    if (!filePath) {
      const firstLine = code.split("\n")[0].trim();
      const commentPathMatch = firstLine.match(
        /^(?:\/\/|\/\*|#)\s*([a-zA-Z0-9_/.@-]+\.(?:tsx?|jsx?|css|json|md))/
      );
      if (commentPathMatch) {
        filePath = commentPathMatch[1];
        // Remove the path comment from the code
        code = code.split("\n").slice(1).join("\n");
      }
    }

    if (!filePath) continue;

    // Normalize path — strip leading / or /home/user/
    filePath = filePath.replace(/^\/home\/user\//, "").replace(/^\/+/, "");

    files[filePath] = code.trimEnd() + "\n";
  }

  return files;
}

// ---------------------------------------------------------------------------

/**
 * Shared state that persists across all iterations of the agent network.
 *
 * - `summary`: Set when the agent outputs a `<task_summary>` block,
 *   signalling that the task is complete.
 * - `files`: A map of relative file paths → file contents for every file
 *   the agent wrote to the sandbox. Saved as a JSON Fragment in the DB.
 * - `sandboxUrl`: The live preview URL, saved early so it's always available.
 * - `lastErrors`: Most recent compilation/runtime errors (if any).
 */
interface CodeAgentState {
  summary: string;
  files: { [filePath: string]: string };
  sandboxUrl: string;
  lastErrors: string;
}

// ---------------------------------------------------------------------------
// Inngest function definition
// ---------------------------------------------------------------------------

/**
 * The main Inngest function that orchestrates the AI developer agent.
 *
 * Triggered by the `"app/developer.generate"` event, which is fired from:
 * - `src/modules/projects/server/router.ts`  (when a new project is created)
 * - `src/modules/messages/server/router.ts`  (when a follow-up message is sent)
 *
 * Event payload shape:
 * ```ts
 * { prompt: string; projectId: string }
 * ```
 */
export const developerAgentFunction = inngest.createFunction(
  { id: "developer-agent" },
  { event: "app/developer.generate" },
  async ({ event, step }) => {
    // -----------------------------------------------------------------------
    // Step 1: Create a fresh E2B sandbox from our custom template
    // -----------------------------------------------------------------------
    const sandboxId = await step.run("create-sandbox", async () => {
      const sandbox = await Sandbox.create("codeflux-nextjs-test-2-modified");
      return sandbox.sandboxId;
    });

    // -----------------------------------------------------------------------
    // Step 1b: Get sandbox preview URL early so it's always available
    // -----------------------------------------------------------------------
    const sandboxPreviewUrl = await step.run("get-sandbox-preview-url", async () => {
      const sandbox = await connectToSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // -----------------------------------------------------------------------
    // Step 2: Define the AI code agent with its tools
    // -----------------------------------------------------------------------
    const codeAgent = createAgent<CodeAgentState>({
      name: "code-agent",
      description: "An experienced software development engineer.",
      system: AGENT_SYSTEM_PROMPT,
      model: openai({
        model: "openai/gpt-oss-120b:free", // Free model via OpenRouter
        apiKey: process.env.OPENROUTER_API_KEY!,
        baseUrl: "https://openrouter.ai/api/v1",
        defaultParameters: {
          temperature: 0.1,
        },
      }),

      tools: [
        // ── Tool: terminal ──────────────────────────────────────────────
        createTool({
          name: "terminal",
          description:
            "Execute a shell command in the sandbox. Use for package installs " +
            "(npm install <pkg> --yes) and file system exploration (ls, find, tree). " +
            "Returns stdout, stderr, and exitCode so you can see real errors.",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const outputBuffers = { stdout: "", stderr: "" };

              // Rewrite the command to exclude node_modules from directory listings
              const safeCommand = sanitizeShellCommand(command);

              try {
                const sandbox = await connectToSandbox(sandboxId);
                const result = await sandbox.commands.run(safeCommand, {
                  onStdout: (data: string) => {
                    outputBuffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    outputBuffers.stderr += data;
                  },
                });

                // Return both stdout and stderr so agent can see warnings/errors
                const output: Record<string, string | number> = {
                  stdout: result.stdout || "",
                  stderr: outputBuffers.stderr || "",
                  exitCode: result.exitCode ?? 0,
                };
                return JSON.stringify(output);
              } catch (error) {
                // Return the real error to the agent instead of swallowing it
                return JSON.stringify({
                  stdout: outputBuffers.stdout,
                  stderr: outputBuffers.stderr || String(error),
                  exitCode: 1,
                  error: String(error),
                });
              }
            });
          },
        }),

        // ── Tool: getDevServerLogs ──────────────────────────────────────
        createTool({
          name: "getDevServerLogs",
          description:
            "Check the Next.js dev server for compilation or runtime errors. " +
            "Fetches sandbox system logs (ERROR/WARN), checks localhost:3000 for the " +
            "Next.js error overlay, and runs a TypeScript check to catch type errors. " +
            "Call this after writing/updating files to verify they compile cleanly.",
          parameters: z.object({}),
          handler: async (_, { step, network }: Tool.Options<CodeAgentState>) => {
            return await step?.run("getDevServerLogs", async () => {
              const sandbox = await connectToSandbox(sandboxId);
              const logs: Record<string, string> = {};

              // 1. Fetch E2B sandbox system logs (dev server stdout/stderr)
              try {
                const { ConnectionConfig: Cfg, ApiClient: Client } = await import("e2b");
                const config = new Cfg();
                const client = new Client(config);
                const res = await (client as unknown as { api: {
                  GET: (path: string, options: Record<string, unknown>) => Promise<{
                    data?: { logEntries?: Array<{ level: string; message: string }> };
                    error?: unknown;
                  }>;
                } }).api.GET("/sandboxes/{sandboxID}/logs", {
                  params: { path: { sandboxID: sandboxId }, query: { limit: 100 } },
                });
                const errorLogs = (res.data?.logEntries ?? []).filter(
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
                const curlResult = await sandbox.commands.run(
                  "curl -s -o /tmp/page_check.html -w '%{http_code}' http://localhost:3000 2>&1"
                );
                const httpStatus = curlResult.stdout.trim();
                logs.httpStatus = httpStatus;

                if (httpStatus !== "200") {
                  try {
                    const errorPage = await sandbox.commands.run(
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
                const tscResult = await sandbox.commands.run(
                  "cd /home/user && npx tsc --noEmit --pretty 2>&1 | tail -80"
                );
                const tscOutput = tscResult.stdout.trim();
                if (tscOutput) {
                  logs.typescriptErrors = tscOutput;
                }
              } catch (error) {
                logs.typescriptCheck = String(error);
              }

              // Store errors in shared state so lifecycle can decide to continue
              const hasErrors = logs.sandboxErrors ||
                logs.typescriptErrors ||
                logs.errorPageContent ||
                (logs.httpStatus && logs.httpStatus !== "200");

              if (hasErrors && network) {
                network.state.data.lastErrors = JSON.stringify(logs);
              } else if (network) {
                network.state.data.lastErrors = "";
              }

              return JSON.stringify(logs, null, 2);
            });
          },
        }),

        // ── Tool: createOrUpdateFiles ───────────────────────────────────
        createTool({
          name: "createOrUpdateFiles",
          description:
            "Create or overwrite files in the sandbox. Paths must be relative " +
            "(e.g. 'app/page.tsx'). Batch multiple files in a single call when possible.",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<CodeAgentState>,
          ) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  // Merge with any files already written in previous iterations
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await connectToSandbox(sandboxId);

                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (error) {
                  // Return real error details so the agent can act on them
                  const errMsg = error instanceof Error
                    ? `${error.name}: ${error.message}\n${error.stack ?? ""}`
                    : String(error);
                  return `File write failed — ${errMsg}`;
                }
              },
            );

            // Persist file map in the shared network state
            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),

        // ── Tool: readFiles ─────────────────────────────────────────────
        createTool({
          name: "readFiles",
          description:
            "Read file contents from the sandbox. Provide absolute paths " +
            "(e.g. '/home/user/app/page.tsx'). Use terminal to discover paths first.",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await connectToSandbox(sandboxId);
                const contents = [];

                for (const filePath of files) {
                  try {
                    const content = await sandbox.files.read(filePath);
                    contents.push({ path: filePath, content });
                  } catch (fileError) {
                    contents.push({
                      path: filePath,
                      content: null,
                      error: String(fileError),
                    });
                  }
                }

                return JSON.stringify(contents);
              } catch (error) {
                // Return real error so the agent can see what happened
                const errMsg = error instanceof Error
                  ? `${error.name}: ${error.message}`
                  : String(error);
                return JSON.stringify({ error: errMsg });
              }
            });
          },
        }),
      ],

      // ── Lifecycle: detect when the agent is done ────────────────────
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const assistantMessage = extractLastAssistantMessage(result);

          if (assistantMessage && network) {
            // ── Fallback: extract code/files from text responses ───────
            // Some models write code as markdown text or embed tool calls
            // as JSON in their response instead of making real function calls.
            // Detect this and write the files for them.
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
                try {
                  const sandbox = await connectToSandbox(sandboxId);
                  for (const [path, content] of Object.entries(extracted)) {
                    await sandbox.files.write(path, content);
                  }
                  network.state.data.files = {
                    ...(network.state.data.files || {}),
                    ...extracted,
                  };
                } catch (err) {
                  console.error("[CodeFlux] Failed to write extracted files:", err);
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
                // Push a correction message so the agent knows what to do
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

    // -----------------------------------------------------------------------
    // Step 3: Wire the agent into a network and run the generation loop
    // -----------------------------------------------------------------------
    const agentNetwork = createNetwork<CodeAgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 30, // Safety cap — prevents infinite loops if the model gets stuck
      router: async ({ network }) => {
        // Stop routing once the agent has produced a summary
        if (network.state.data.summary) return;
        return codeAgent;
      },
    });

    // Save the sandbox URL early so the UI can show the preview link immediately
    await step.run("save-sandbox-url-early", async () => {
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: `Sandbox started. Preview: ${sandboxPreviewUrl}`,
          role: "ASSISTANT",
          type: "RESULT",
        },
      });
    });

    // Execute the agent network with the user's prompt
    let agentResult;
    try {
      agentResult = await agentNetwork.run(event.data.prompt);
    } catch (error) {
      // ── Show the REAL error — no hardcoded messages ──────────────────
      const errorString = error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack ?? ""}`
        : String(error);

      console.error("[CodeFlux] Agent error:", errorString);

      await step.run("save-ai-error-message", async () => {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: `⚠️ Agent error:\n\n${errorString}`,
            role: "ASSISTANT",
            type: "ERROR",
            fragment: {
              create: {
                sandboxUrl: sandboxPreviewUrl,
                title: "Fragment (error)",
                files: agentNetwork.state?.data?.files || {},
              },
            },
          },
        });
      });

      return { error: errorString, url: sandboxPreviewUrl };
    }

    // -----------------------------------------------------------------------
    // Step 4: Determine success/failure and persist the result
    // -----------------------------------------------------------------------
    const isIncompleteResult =
      !agentResult.state.data.summary ||
      Object.keys(agentResult.state.data.files || {}).length === 0;

    // Save the final result (success or incomplete) to the database
    await step.run("save-agent-result", async () => {
      if (isIncompleteResult) {
        const hasSummary = !!agentResult.state.data.summary;
        const hasFiles =
          Object.keys(agentResult.state.data.files || {}).length > 0;
        const lastErrors = agentResult.state.data.lastErrors || "";

        const detail =
          !hasSummary && !hasFiles
            ? "No summary and no files were generated."
            : !hasSummary
              ? "Files were created but the model never produced a <task_summary>."
              : "Summary exists but no files were written to the sandbox.";

        const errorContext = lastErrors
          ? `\n\nLast known errors:\n${lastErrors}`
          : "";

        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content:
              `⚠️ Agent ran ${agentNetwork.state.results.length} iteration(s) but result is incomplete. ` +
              `${detail}${errorContext}`,
            role: "ASSISTANT",
            type: "ERROR",
            fragment: {
              create: {
                sandboxUrl: sandboxPreviewUrl,
                title: "Fragment (incomplete)",
                files: agentResult.state.data.files || {},
              },
            },
          },
        });
      }

      // Success — save the assistant message with an attached code fragment
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: agentResult.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxPreviewUrl,
              title: "Fragment",
              files: agentResult.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxPreviewUrl,
      title: "Fragment",
      files: agentResult.state.data.files,
      summary: agentResult.state.data.summary,
    };
  },
);
