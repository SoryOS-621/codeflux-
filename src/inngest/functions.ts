import 'dotenv/config'
import { Sandbox } from '@e2b/code-interpreter'

import { inngest } from "./client";
import { gemini, createAgent } from "@inngest/agent-kit";
import { AwardIcon } from 'lucide-react';
import { getSandbox } from './utils';

// export const helloWorld = inngest.createFunction(
//   { id: "hello-world" },
//   { event: "test/hello.world" },
//   async ({ event, step }) => {
//     await step.sleep("wait-a-moment", "5s");
//     return { message: `Hello src/inngest/functions: ${event.data.value}` };
//   },
// );

export const writer = inngest.createFunction(
  { id: "writer" },
  { event: "app/writerEvent" },
  async ({ event, step }) => {
    const sandBoxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("dhruvb2028/codeflux-nextjs-test-2")
      return sandbox.sandboxId;
    })

    // Create a new agent with a system prompt (you can add optional tools, too)
    const writerAgent = createAgent({
      name: "coder",
      system: "You are an experienced React and Next JS software engineer. You write clean, simple, maintainable code.",
      model: gemini({model:"gemini-2.5-flash", apiKey: process.env.GEMINI_API_KEY}),
    });
    

    // Run the agent with an input.  This automatically uses steps
    // to call your AI model.
    const {output} = await writerAgent.run(`Write the code snippets for following task: ${event.data.value}`);

    const sandboxUrl = await step.run("get-sandbox-url", async ()=> {
      const sandbox = await getSandbox(sandBoxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`

    })

    return {output, sandboxUrl}
  }
);


