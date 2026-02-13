/**
 * @file router.ts  (Messages module)
 * @description tRPC router for message-related API endpoints.
 *
 * ## Endpoints
 * - `messages.getMany`  — Query:    Returns all messages, newest first.
 * - `messages.create`   — Mutation: Sends a follow-up prompt to an existing project,
 *                                   then triggers the AI developer agent via Inngest.
 *
 * ## Data flow for `messages.create`:
 * 1. User types a follow-up prompt on the project detail page
 * 2. A new USER Message row is created in the DB
 * 3. An Inngest event `"app/developer.generate"` is fired with the prompt + projectId
 * 4. The developer agent picks it up and continues code generation
 */

import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";
import prisma from "@/lib/prisma-client";
import { inngest } from "@/inngest/client";

/** Input validation schema for creating a new message. */
const createMessageInput = z.object({
  /** The user's follow-up prompt text. */
  prompt: z
    .string()
    .min(1, { message: "Prompt is required." })
    .max(10000, { message: "Prompt is too long." }),

  /** The ID of the project this message belongs to. */
  projectId: z
    .string()
    .min(1, { message: "Project ID is required." }),
});

export const messagesRouter = createTRPCRouter({
  /**
   * Get all messages ordered by most recently updated.
   * Typically filtered by projectId on the client side.
   */
  getMany: baseProcedure.query(async () => {
    const messages = await prisma.message.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });

    return messages;
  }),

  /**
   * Send a follow-up message to an existing project and trigger the AI agent.
   *
   * @param input.prompt    - The follow-up prompt text.
   * @param input.projectId - The project to attach this message to.
   */
  create: baseProcedure
    .input(createMessageInput)
    .mutation(async ({ input }) => {
      // Save the user's follow-up message
      await prisma.message.create({
        data: {
          projectId: input.projectId,
          content: input.prompt,
          role: "USER",
          type: "RESULT",
        },
      });

      // Fire the Inngest event that triggers the AI developer agent
      await inngest.send({
        name: "app/developer.generate",
        data: {
          prompt: input.prompt,
          projectId: input.projectId,
        },
      });
    }),
});
