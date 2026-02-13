/**
 * @file route.ts  (Inngest API endpoint)
 * @description Serves the Inngest webhook at `/api/inngest`.
 *
 * Inngest sends events to this endpoint, which then dispatches
 * them to the registered functions (e.g. `developerAgentFunction`).
 *
 * ## Adding a new Inngest function
 * 1. Create your function in `src/inngest/`
 * 2. Import it here
 * 3. Add it to the `functions` array below
 */

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { developerAgentFunction } from "@/inngest/developer-agent";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    developerAgentFunction,
    // Add new Inngest functions here
  ],
});