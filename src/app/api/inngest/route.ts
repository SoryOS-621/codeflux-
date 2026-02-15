/**
 * @file route.ts  (Inngest API endpoint)
 * @description Serves the Inngest webhook at `/api/inngest`.
 *
 * Inngest sends events to this endpoint, which then dispatches
 * them to the registered functions (e.g. `developerAgentFunction`).
 *
 * This route imports from the infrastructure layer — it does NOT
 * import from `src/inngest/` directly.
 *
 * ## Adding a new Inngest function
 * 1. Create your function in `src/infrastructure/queue/inngest.ts`
 * 2. Wire it in `src/infrastructure/index.ts`
 * 3. Import it here and add to the `functions` array
 */

import { serve } from "inngest/next";
import {
  inngestClient,
  developerAgentFunction,
} from "@/infrastructure";

export const { GET, POST, PUT } = serve({
  client: inngestClient,
  functions: [
    developerAgentFunction,
    // Add new Inngest functions here
  ],
});