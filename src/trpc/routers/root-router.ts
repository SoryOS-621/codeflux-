/**
 * @file root-router.ts
 * @description The top-level tRPC router that combines all feature routers.
 *
 * Every tRPC router from `src/modules/` is mounted here under a namespace.
 * The exported `AppRouter` type is used by the client-side tRPC setup
 * for end-to-end type safety.
 *
 * ## Adding a new feature router
 * 1. Create a router file in `src/modules/<feature>/server/router.ts`
 * 2. Import it here
 * 3. Add it to the `createTRPCRouter({...})` call below
 *
 * @example
 * ```ts
 * // Client-side usage (auto-completed from this router):
 * trpc.projects.create.mutate({ prompt: "Build a todo app" })
 * trpc.messages.getMany.useQuery()
 * ```
 */

import { projectsRouter } from "@/modules/projects/server/router";
import { createTRPCRouter } from "../init";
import { messagesRouter } from "@/modules/messages/server/router";
import { templatesRouter } from "@/modules/templates/server/router";

export const appRouter = createTRPCRouter({
  /** Project CRUD — create projects, list all projects */
  messages: messagesRouter,

  /** Message CRUD — send follow-up messages, list message history */
  projects: projectsRouter,

  /** Template listing — preconfigured project templates */
  templates: templatesRouter,
});

/** The full type of the tRPC API — used for client-side type inference. */
export type AppRouter = typeof appRouter;
