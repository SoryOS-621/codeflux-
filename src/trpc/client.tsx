'use client';
// ^-- Must be a client component to mount React providers

/**
 * @file client.tsx
 * @description Client-side tRPC setup.
 *
 * Provides two key exports:
 * - `TRPCReactProvider` — Wraps the app in tRPC + TanStack Query providers
 *   (mounted in `layout.tsx`).
 * - `useTRPC` — React hook to access the typed tRPC client in any
 *   client component.
 *
 * ## How it connects to the backend
 * All tRPC requests are sent as HTTP batched requests to `/api/trpc`.
 * SuperJSON serialization is used so Date objects, Maps, etc. survive
 * the round-trip.
 */

import superjson from 'superjson';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/root-router';
/** Typed tRPC context — provides `TRPCProvider` and the `useTRPC` hook. */
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

/** Singleton QueryClient for the browser (avoids re-creation on re-renders). */
let browserQueryClient: QueryClient;

/**
 * Returns a stable QueryClient instance.
 * - Server-side: always creates a fresh client (no shared state between requests).
 * - Browser-side: reuses a singleton so React Suspense doesn't discard it.
 */
function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
/**
 * Resolves the tRPC API base URL.
 * - Browser: empty string (relative URL — same origin).
 * - Server (SSR): uses `NEXT_PUBLIC_APP_URL` env var for absolute URL.
 */
function getTRPCBaseUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return '';
    return process.env.NEXT_PUBLIC_APP_URL;
  })();
  return `${base}/api/trpc`;
}

/**
 * Top-level provider that wraps the app with tRPC + TanStack Query.
 * Mount this once in `layout.tsx`.
 */
export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getTRPCBaseUrl(),
        }),
      ],
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}