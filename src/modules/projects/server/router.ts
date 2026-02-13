/**
 * @file router.ts  (Projects module)
 * @description tRPC router for project-related API endpoints.
 *
 * ## Endpoints
 * - `projects.getMany`  — Query:    Returns all projects, newest first.
 * - `projects.create`   — Mutation: Creates a new project from a user prompt,
 *                                   then triggers the AI developer agent via Inngest.
 *
 * ## Data flow for `projects.create`:
 * 1. User submits a prompt from the UI
 * 2. A new Project row is created in the DB (with an auto-generated slug name)
 * 3. The prompt is saved as the first USER Message on that project
 * 4. An Inngest event `"app/developer.generate"` is fired
 * 5. The developer agent picks it up and starts code generation in a sandbox
 */

import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";
import prisma from "@/lib/prisma-client";
import { inngest } from "@/inngest/client";
import { generateSlug } from "random-word-slugs";

/** Input validation schema for creating a new project. */
const createProjectInput = z.object({
  /** The user's natural-language prompt describing what to build. */
  prompt: z
    .string()
    .min(1, { message: "Prompt is required." })
    .max(10000, { message: "Prompt is too long." }),
});

export const projectsRouter = createTRPCRouter({
  /**
   * Get all projects ordered by most recently updated.
   * Used on the home/dashboard page to list existing projects.
   */
  getMany: baseProcedure.query(async () => {
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });

    return projects;
  }),

  /**
   * Create a new project and kick off AI code generation.
   *
   * @param input.prompt - The user's description of what to build.
   * @returns The newly created Project record.
   */
  create: baseProcedure
    .input(createProjectInput)
    .mutation(async ({ input }) => {
      // Create the project with a random human-readable slug name
      const createdProject = await prisma.project.create({
        data: {
          name: generateSlug(2, { format: "kebab" }),
          messages: {
            create: {
              content: input.prompt,
              role: "USER",
              type: "RESULT",
            },
          },
        },
      });

      // Fire the Inngest event that triggers the AI developer agent
      await inngest.send({
        name: "app/developer.generate",
        data: {
          prompt: input.prompt,
          projectId: createdProject.id,
        },
      });

      return createdProject;
    }),
});
