import { inngest } from "./client";
import { gemini, createAgent } from "@inngest/agent-kit";

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
  async ({ event }) => {

    // Create a new agent with a system prompt (you can add optional tools, too)
    const writerAgent = createAgent({
      name: "writer",
      system: "You are an expert writer. You write catchy viral content for advertisements.",
      model: gemini({model:"gemini-2.5-flash", apiKey: process.env.GEMINI_API_KEY}),
    });
    

    // Run the agent with an input.  This automatically uses steps
    // to call your AI model.
    const result = await writerAgent.run(`${event.data.value}`);

    return {result}
  }
);


