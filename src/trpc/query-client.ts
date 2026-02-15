/**
 * @file query-client.ts
 * @description TanStack Query client factory.
 *
 * Creates a QueryClient with:
 * - 30-second stale time (data is considered fresh for 30s after fetching)
 * - SuperJSON serialization for SSR hydration (so Dates etc. survive transfer)
 * - Dehydration of pending queries (useful with React Suspense)
 *
 * Used by both `client.tsx` (browser) and `server.tsx` (SSR).
 */

import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
import superjson from 'superjson';

/** Creates a fresh QueryClient instance with app-wide defaults. */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}