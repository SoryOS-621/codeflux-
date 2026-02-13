/**
 * @file init.ts
 * @description tRPC server-side initialization.
 *
 * Creates the core tRPC instance with SuperJSON serialization and
 * exports the building blocks used by every router:
 * - `createTRPCRouter` — Defines a group of related procedures
 * - `baseProcedure`    — The default procedure (no auth middleware yet)
 * - `createCallerFactory` — For server-side direct calls
 * - `createTRPCContext`  — Request context available in every procedure
 *
 * ## Adding auth middleware
 * When you add authentication, create a new `protectedProcedure` that
 * extends `baseProcedure` with an auth middleware, then use it in
 * routers that require a logged-in user.
 */

import { initTRPC } from '@trpc/server';
import { cache } from 'react';
import superjson from 'superjson';

/**
 * Creates the request context available in every tRPC procedure.
 * Cached per-request so it’s only computed once even if called multiple times.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = cache(async () => {
  return { userId: 'user_123' }; // TODO: Replace with real auth when adding login
});

// Initialize tRPC with SuperJSON for rich type serialization (Dates, Maps, etc.)
const t = initTRPC.create({
  transformer: superjson,
});

/** Creates a namespaced tRPC router (used in each module's router file). */
export const createTRPCRouter = t.router;

/** Factory for creating server-side callers (bypasses HTTP). */
export const createCallerFactory = t.createCallerFactory;

/** The base procedure — no auth required. Extend this for protected routes. */
export const baseProcedure = t.procedure;