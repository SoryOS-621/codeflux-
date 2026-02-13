/**
 * @file router.ts  (Messages module)
 * @description tRPC router for message-related API endpoints.
 *
 * ## Endpoints
 * - `messages.getMany`  — Query:    Returns all messages, newest first.
 * - `messages.create`   — Mutation: Sends a follow-up prompt to an existing project,
 *                                   then triggers the AI developer agent via the queue.
 *
 * ## Data flow for `messages.create`:
 * 1. User types a follow-up prompt on the project detail page
 * 2. A new USER Message row is created in the DB
 * 3. A job is enqueued via the QueueProvider
 * 4. The queue handler picks it up and continues code generation
 *
 * ## Dependency Direction
 * This module imports from `infrastructure/` for provider singletons.
 * It does NOT import Prisma, Inngest, or any SDK directly.
 */

import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";
import { databaseProvider, queueProvider } from "@/infrastructure";

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
    return await databaseProvider.getMessages();
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
      await databaseProvider.createMessage({
        projectId: input.projectId,
        content: input.prompt,
        role: "USER",
        type: "RESULT",
      });

      // Enqueue the code generation job via the queue provider
      await queueProvider.enqueue({
        eventName: "app/developer.generate",
        data: {
          prompt: input.prompt,
          projectId: input.projectId,
        },
      });
    }),
});
