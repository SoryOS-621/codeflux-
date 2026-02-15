/**
 * @file core/agents/planner.ts
 * @description PlannerAgent — analyzes the user prompt and produces a structured plan.
 *
 * The PlannerAgent is the first agent in the pipeline. It takes the raw
 * user prompt and produces a structured plan that guides the CoderAgent:
 * - High-level description of what will be built
 * - Ordered steps to follow
 * - Files that need to be created
 * - Dependencies that need to be installed
 *
 * This agent uses a lightweight AI call (no tool use) to generate the plan.
 */

import { BaseAgent } from "./base";
import type { AgentContext, PlannerInput, PlannerOutput } from "./types";

/** System prompt for the planner — instructs the AI to output a structured plan. */
const PLANNER_SYSTEM_PROMPT = `You are a senior software architect planning a Next.js 15 project implementation.

Given a user's description of what they want to build, produce a structured plan in JSON format.

You are planning for a sandboxed Next.js 15.3.3 environment with:
- Tailwind CSS (preconfigured)
- Shadcn UI components (all pre-installed at @/components/ui/*)
- Lucide React icons
- TypeScript

Rules:
- Only plan for static/local data (no external APIs unless the user specifically asks)
- All component file paths should be relative (e.g. "app/page.tsx", "app/components/header.tsx")
- layout.tsx already exists — do NOT include it in filesToCreate
- The dev server is already running at port 3000 with hot reload
- Do NOT plan to run "npm run dev", "npm run build", etc.
- Shadcn dependencies (radix-ui, lucide-react, class-variance-authority, tailwind-merge) are already installed
- Only list dependencies that are NOT already available

Respond with ONLY valid JSON (no markdown, no explanation):

{
  "description": "A 1-2 sentence description of what will be built",
  "steps": [
    "Step 1: ...",
    "Step 2: ...",
    ...
  ],
  "filesToCreate": [
    "app/page.tsx",
    "app/components/header.tsx",
    ...
  ],
  "dependenciesToInstall": [
    "package-name",
    ...
  ]
}`;

export class PlannerAgent extends BaseAgent<PlannerInput, PlannerOutput> {
  readonly name = "PlannerAgent";

  async execute(
    input: PlannerInput,
    context: AgentContext,
  ): Promise<PlannerOutput> {
    // Emit planning_started
    this.emit(context, "planning_started", { prompt: input.prompt });
    this.emitStatus(context, "Analyzing your request and creating a plan...");

    try {
      // Use the AI provider for a single-turn completion (no tools needed)
      const result = await context.aiProvider.runAgentLoop(
        context.aiConfig,
        PLANNER_SYSTEM_PROMPT,
        input.prompt,
        [], // No tools — just a text completion
        1, // Single iteration
        { agentName: "planner-agent" },
      );

      // Parse the structured plan from the AI response
      const plan = this.parsePlan(result.state.summary || "");

      this.log(
        `Plan created: ${plan.steps.length} steps, ${plan.filesToCreate.length} files, ${plan.dependenciesToInstall.length} deps`,
      );

      // Emit planning_completed
      this.emit(context, "planning_completed", { plan });
      this.emitStatus(
        context,
        `Plan ready: ${plan.steps.length} steps, ${plan.filesToCreate.length} files to create`,
      );

      return { plan };
    } catch (error) {
      // If planning fails, create a minimal fallback plan
      this.logError("Planning failed, using fallback plan", error);
      this.emitStatus(
        context,
        "Planning via AI unavailable — proceeding with direct implementation...",
      );

      const fallbackPlan = {
        description: `Build what the user requested: ${input.prompt.slice(0, 100)}`,
        steps: ["Implement the requested feature directly"],
        filesToCreate: ["app/page.tsx"],
        dependenciesToInstall: [],
      };

      this.emit(context, "planning_completed", { plan: fallbackPlan });
      return { plan: fallbackPlan };
    }
  }

  /**
   * Parse the AI's JSON response into a structured plan.
   * Falls back to a minimal plan if parsing fails.
   */
  private parsePlan(
    raw: string,
  ): PlannerOutput["plan"] {
    try {
      // Extract JSON from the response (may be wrapped in markdown code blocks)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      return {
        description:
          typeof parsed.description === "string"
            ? parsed.description
            : "Implement the requested feature",
        steps: Array.isArray(parsed.steps)
          ? (parsed.steps as string[]).filter(
              (s) => typeof s === "string",
            )
          : ["Implement the feature"],
        filesToCreate: Array.isArray(parsed.filesToCreate)
          ? (parsed.filesToCreate as string[]).filter(
              (f) => typeof f === "string",
            )
          : ["app/page.tsx"],
        dependenciesToInstall: Array.isArray(parsed.dependenciesToInstall)
          ? (parsed.dependenciesToInstall as string[]).filter(
              (d) => typeof d === "string",
            )
          : [],
      };
    } catch {
      this.log("Failed to parse plan JSON, using fallback");
      return {
        description: "Implement the requested feature",
        steps: ["Implement the feature directly"],
        filesToCreate: ["app/page.tsx"],
        dependenciesToInstall: [],
      };
    }
  }
}
