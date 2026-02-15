/**
 * @file server.tsx
 * @description Server-side tRPC caller for use in React Server Components.
 *
 * ## Usage in a Server Component
 * ```tsx
 * import { trpc } from "@/trpc/server";
 *
 * export default async function Page() {
 *   const projects = await trpc.projects.getMany();
 *   return <div>{projects.length} projects</div>;
 * }
 * ```
 *
 * This bypasses HTTP entirely — the tRPC router is called directly
 * on the server, which is faster and avoids network overhead.
 */

import 'server-only';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/root-router';

/** Cached query client — same instance is reused within a single request. */
export const getQueryClient = cache(makeQueryClient);

/** Server-side tRPC proxy — call tRPC procedures directly without HTTP. */
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});