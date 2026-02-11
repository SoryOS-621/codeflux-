import 'dotenv/config'
import { Sandbox } from '@e2b/code-interpreter'
import z from 'zod';
import { inngest } from "./client";
import { openai, createAgent, createTool, createNetwork, Tool } from "@inngest/agent-kit";
import { getSandbox, lastAssistantTextMessageContent } from './utils';
import { PROMPT } from '@/prompt';
import prisma from '@/lib/prisma';

/**
 * Forcefully rewrites directory-listing commands so that node_modules
 * is excluded at the shell level — the directory is never even traversed.
 */
function sanitizeCommand(raw: string): string {
  // Split on pipes to handle each segment independently
  const segments = raw.split('|');
  const rewritten = segments.map((seg) => {
    const trimmed = seg.trim();

    // ls — use --ignore flag so node_modules is never listed
    if (/^ls\b/.test(trimmed)) {
      // Avoid duplicate --ignore if already present
      if (!trimmed.includes('--ignore') || !trimmed.includes('node_modules')) {
        return ` ${trimmed} --ignore='node_modules'`;
      }
    }

    // find — use -prune so the directory is never descended into
    if (/^find\b/.test(trimmed) && !trimmed.includes('node_modules')) {
      // Extract the find path (second token) and the rest of the arguments
      const tokens = trimmed.split(/\s+/);
      const findCmd = tokens[0]; // "find"
      const findPath = tokens[1] || '.'; // path argument
      const rest = tokens.slice(2).join(' ');
      return ` ${findCmd} ${findPath} -name 'node_modules' -prune -o ${rest || '-print'} ${rest ? '' : ''}`.replace(/\s+$/, '');
    }

    // tree — use -I so node_modules is never traversed
    if (/^tree\b/.test(trimmed) && !trimmed.includes('node_modules')) {
      return ` ${trimmed} -I 'node_modules'`;
    }

    // du — use --exclude so node_modules is skipped entirely
    if (/^du\b/.test(trimmed) && !trimmed.includes('node_modules')) {
      return ` ${trimmed} --exclude='node_modules'`;
    }

    return seg;
  });

  return rewritten.join('|');
}

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const developer = inngest.createFunction(
  { id: "developer" },
  { event: "app/developerEvent" },
  async ({ event, step }) => {
    const sandBoxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("dhruvb2028/codeflux-nextjs-test-3");
      return sandbox.sandboxId;
    });

    // Create a new agent with a system prompt (you can add optional tools, too)
    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An experienced software development engineer.",
      system: PROMPT,
      model: openai({
        model: "openai/gpt-oss-120b:free", // Free model from OpenRouter
        apiKey: process.env.OPENROUTER_API_KEY!,
        baseUrl: "https://openrouter.ai/api/v1",
        defaultParameters: {
          temperature: 0.1,
        },
      }),
      tools: [
        // Terminal Tool
        createTool({
          name: "terminal",
          description:
            "Run shell commands for inspection and installs. Always limit output size. Use commands like: ls | head, ls app, find app -maxdepth 2, or tree -L 2. Never run plain ls on large folders like node_modules.",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({command}, {step}) => {
            return await step?.run("terminal", async ()=>{
              const buffers = { stdout: "", stderr: ""}

              // Forcefully exclude node_modules from ls, find, tree, and similar directory listing commands
              const sanitizedCommand = sanitizeCommand(command);

              try {
                const sandbox = await getSandbox(sandBoxId);
                const result = await sandbox.commands.run(sanitizedCommand, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  }
                })
                return result.stdout;
              } catch (e) {
                console.log(`Command Failed: ${e} \n stdout: ${buffers.stdout} \n stderror: ${buffers.stderr}`)
              }
            });
          },
        }),

        // Create or Update Files Tool
        createTool({
          name: "createOrUpdateFiles",
          description:
            "Create or update files in the sandbox. Use this for ALL code and content changes. Each path must be relative. Do NOT use absolute paths. Do NOT paste full files in chat—apply changes through this tool.",
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
            { step, network }: Tool.Options<AgentState>,
          ) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandBoxId);
                for(const file of files){
                  await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }
                  return updatedFiles;
                } catch (e) {
                  return "Error: " + e;
                }
              },
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),

        // Read Files Tool
        createTool({
          name: "readFiles",
          description:
            "Read the contents of existing files in the sandbox. Use this ONLY for real files with known paths. Do NOT use on folders. Use terminal (ls, find) to explore directories first.",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandBoxId);
                const contents = [];
                for(const file of files){
                  const content = await sandbox.files.read(file);
                  contents.push({path:file, content})
                }
                return JSON.stringify(contents);

              } catch (e) {
                return "Error: " + e;
              }
            });
          },
        }),
      ],

      //LifeCycle
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 10,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) return;

        return codeAgent;
      },
    });

    // Run the agent with an input.  This automatically uses steps
    // to call your AI model.
    const result = await network.run(event.data.value);
    // const {output} = await codeAgent.run(`Write the code snippets for following task: ${event.data.value}`);

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandBoxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again later.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
