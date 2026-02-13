/**
 * @file route.ts  (tRPC HTTP handler)
 * @description Handles all tRPC API requests at `/api/trpc/[procedure]`.
 *
 * This is a Next.js catch-all route that forwards HTTP requests to
 * the tRPC router. Both GET (queries) and POST (mutations) are supported.
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/root-router';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };