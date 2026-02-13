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
 * Shared state that persists across all iterations of the agent network.
 *
 * - `summary`: Set when the agent outputs a `<task_summary>` block,
 *   signalling that the task is complete.
 * - `files`: A map of relative file paths → file contents for every file
 *   the agent wrote to the sandbox. Saved as a JSON Fragment in the DB.
 */
interface CodeAgentState {
  summary: string;
  files: { [filePath: string]: string };
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
            "Run shell commands for inspection and installs. Always limit output size. " +
            "Use commands like: ls | head, ls app, find app -maxdepth 2, or tree -L 2. " +
            "Never run plain ls on large folders like node_modules.",
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
                return result.stdout;
              } catch (error) {
                console.log(
                  `[terminal] Command failed: ${error}\n` +
                    `stdout: ${outputBuffers.stdout}\n` +
                    `stderr: ${outputBuffers.stderr}`,
                );
              }
            });
          },
        }),

        // ── Tool: createOrUpdateFiles ───────────────────────────────────
        createTool({
          name: "createOrUpdateFiles",
          description:
            "Create or update files in the sandbox. Use this for ALL code and content " +
            "changes. Each path must be relative. Do NOT use absolute paths. " +
            "Do NOT paste full files in chat—apply changes through this tool.",
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
                  return "Error: " + error;
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
            "Read the contents of existing files in the sandbox. Use this ONLY for " +
            "real files with known paths. Do NOT use on folders. Use terminal (ls, find) " +
            "to explore directories first.",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await connectToSandbox(sandboxId);
                const contents = [];

                for (const filePath of files) {
                  const content = await sandbox.files.read(filePath);
                  contents.push({ path: filePath, content });
                }

                return JSON.stringify(contents);
              } catch (error) {
                return "Error: " + error;
              }
            });
          },
        }),
      ],

      // ── Lifecycle: detect when the agent is done ────────────────────
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const assistantMessage = extractLastAssistantMessage(result);

          // The agent signals completion by including <task_summary> in its reply
          if (assistantMessage && network) {
            if (assistantMessage.includes("<task_summary>")) {
              network.state.data.summary = assistantMessage;
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

    // Execute the agent network with the user's prompt
    let agentResult;
    try {
      agentResult = await agentNetwork.run(event.data.prompt);
    } catch (error) {
      // ── Handle upstream AI errors gracefully ──────────────────────────
      const errorString = String(error);
      console.error(
        "[CodeFlux] Upstream AI error (not a CodeFlux bug):",
        errorString.slice(0, 300),
      );

      let userFacingMessage: string;
      if (
        errorString.includes("Failed to parse JSON") ||
        errorString.includes("Expected ','")
      ) {
        userFacingMessage =
          "⚠️ AI model returned broken JSON. Free model likely crashed mid-response. Retry or switch model.";
      } else if (
        errorString.includes("401") ||
        errorString.includes("403") ||
        errorString.includes("Unauthorized")
      ) {
        userFacingMessage =
          "⚠️ API key rejected. Check OPENROUTER_API_KEY in .env (no trailing spaces).";
      } else if (
        errorString.includes("429") ||
        errorString.includes("rate limit")
      ) {
        userFacingMessage = "⚠️ Rate limited. Wait a minute and retry.";
      } else if (
        errorString.includes("502") ||
        errorString.includes("503") ||
        errorString.includes("timeout")
      ) {
        userFacingMessage =
          "⚠️ AI provider down/timed out. Retry later or switch model.";
      } else {
        userFacingMessage = `⚠️ Upstream AI error: ${errorString.slice(0, 150)}`;
      }

      await step.run("save-ai-error-message", async () => {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: userFacingMessage,
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      });

      return { error: userFacingMessage };
    }

    // -----------------------------------------------------------------------
    // Step 4: Determine success/failure and persist the result
    // -----------------------------------------------------------------------
    const isIncompleteResult =
      !agentResult.state.data.summary ||
      Object.keys(agentResult.state.data.files || {}).length === 0;

    // Get the live preview URL of the sandbox's dev server
    const sandboxPreviewUrl = await step.run("get-sandbox-preview-url", async () => {
      const sandbox = await connectToSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // Save the final result (success or incomplete) to the database
    await step.run("save-agent-result", async () => {
      if (isIncompleteResult) {
        const hasSummary = !!agentResult.state.data.summary;
        const hasFiles =
          Object.keys(agentResult.state.data.files || {}).length > 0;

        const detail =
          !hasSummary && !hasFiles
            ? "No summary and no files were generated."
            : !hasSummary
              ? "Files were created but the model never produced a <task_summary>."
              : "Summary exists but no files were written to the sandbox.";

        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content:
              `⚠️ Agent ran ${agentNetwork.state.results.length} iteration(s) but result is incomplete. ` +
              `${detail} This usually means the model ran out of tokens, got stuck in a loop, ` +
              `or the prompt was too complex. Try a shorter/simpler prompt or switch to a stronger model.`,
            role: "ASSISTANT",
            type: "ERROR",
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
