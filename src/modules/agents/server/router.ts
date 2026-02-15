/**
 * @file modules/agents/server/router.ts
 * @description tRPC router for agent-related API endpoints.
 *
 * PLACEHOLDER — this module is ready for agent-specific endpoints
 * such as:
 * - Querying agent status
 * - Listing active/completed agent runs
 * - Cancelling running agents
 * - Viewing agent logs
 *
 * ## Dependency Direction
 * This module imports from `infrastructure/` for provider singletons.
 * It does NOT import Prisma, Inngest, or any SDK directly.
 */

import { baseProcedure, createTRPCRouter } from "@/trpc/init";

export const agentsRouter = createTRPCRouter({
  /**
   * Health check — verifies the agents module is wired correctly.
   */
  status: baseProcedure.query(async () => {
    return { status: "ok" };
  }),
});
