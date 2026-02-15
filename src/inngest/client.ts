/**
 * @file client.ts
 * @description Inngest client instance shared across the entire app.
 *
 * This client is used to:
 * - Register Inngest functions (in `developer-agent.ts`)
 * - Send events that trigger background jobs (in module routers)
 * - Serve the Inngest API endpoint (in `app/api/inngest/route.ts`)
 *
 * The `id` must match across all environments (dev, staging, prod).
 */

import { Inngest } from "inngest";

/** The shared Inngest client — used for both sending and receiving events. */
export const inngest = new Inngest({ id: "codeflux" });