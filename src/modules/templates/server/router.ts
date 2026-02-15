/**
 * @file modules/templates/server/router.ts
 * @description tRPC router for template-related API endpoints.
 *
 * ## Endpoints
 * - `templates.getAll` — Query: Returns all available template metadata (no file contents).
 *
 * Templates are defined statically in `src/core/templates/` and do not
 * require database access. This router simply exposes them to the client.
 */

import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { getTemplateMetadata } from "@/core/templates";

export const templatesRouter = createTRPCRouter({
  /**
   * Get all available templates with their metadata.
   * File contents are excluded to keep the payload small.
   */
  getAll: baseProcedure.query(async () => {
    return getTemplateMetadata();
  }),
});
