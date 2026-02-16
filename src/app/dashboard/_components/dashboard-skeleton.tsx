/**
 * @file dashboard/_components/dashboard-skeleton.tsx
 * @description Skeleton loading state for the dashboard page.
 *
 * Shows placeholder cards that pulse while project data is loading.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Search bar skeleton */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Skeleton className="h-9 flex-1 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-8 w-[72px]" />
        </div>
      </div>

      {/* Project cards skeleton grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-4/5" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
