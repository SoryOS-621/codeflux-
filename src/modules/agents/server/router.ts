/**
 * @file modules/agents/server/router.ts
 * @description tRPC router for agent-related API endpoints.
 *
 * Provides endpoints for:
 * - Health check
 * - Querying agent run status (active connections, event history)
 * - Clearing event history for a project
 *
 * ## Dependency Direction
 * This module imports from `infrastructure/` for provider singletons.
 * It does NOT import Prisma, Inngest, or any SDK directly.
 */

import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { eventBus, eventStreamProvider } from "@/infrastructure";

export const agentsRouter = createTRPCRouter({
  /**
   * Health check — verifies the agents module is wired correctly.
   */
  status: baseProcedure.query(async () => {
    return { status: "ok" };
  }),

  /**
   * Get the current agent run status for a project.
   * Returns event history, active SSE connections, and whether the run
   * has completed.
   */
  runStatus: baseProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const history = eventBus.getHistory(input.projectId);
      const activeConnections = eventStreamProvider.getActiveConnections(
        input.projectId,
      );

      // Check if the run has reached a terminal state
      const isComplete = history.some(
        (e) => e.type === "completed" || e.type === "fatal_error",
      );

      // Get the latest status message
      const statusEvents = history.filter((e) => e.type === "status_update");
      const latestStatus =
        statusEvents.length > 0
          ? (statusEvents[statusEvents.length - 1].payload as { message: string }).message
          : null;

      return {
        eventCount: history.length,
        activeConnections,
        isComplete,
        latestStatus,
        // Return last 10 events for quick overview (full history via SSE)
        recentEvents: history.slice(-10),
      };
    }),

  /**
   * Clear event history for a project.
   * Call after persisting events to a database, or when the user
   * navigates away from the project.
   */
  clearHistory: baseProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      eventBus.clearHistory(input.projectId);
      return { cleared: true };
    }),

  /**
   * Full cleanup — remove all listeners and history for a project.
   * Call when a project's run is fully finalized and no more SSE
   * clients will connect.
   */
  cleanup: baseProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      eventBus.cleanup(input.projectId);
      return { cleaned: true };
    }),
});
