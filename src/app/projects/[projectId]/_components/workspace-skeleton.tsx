/**
 * @file _components/workspace-skeleton.tsx
 * @description Premium skeleton loading state matching the new workspace layout:
 * Header → Status bar → Sidebar | Chat | RightPanel
 */

import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-background animate-fade-in-up">
      {/* Header skeleton */}
      <div className="flex h-11 items-center justify-between px-3 border-b bg-card/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-4 w-px bg-border" />
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>

      {/* Status bar skeleton */}
      <div className="flex h-7 items-center gap-4 border-b bg-card/30 px-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20 ml-auto" />
        <Skeleton className="h-3 w-14" />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-[260px] border-r bg-sidebar p-3 space-y-4 hidden md:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
          {/* File tree */}
          <div className="space-y-1">
            <Skeleton className="h-3 w-16 mb-2" />
            {[120, 100, 90, 110, 80, 95, 70].map((w, i) => (
              <div key={i} className="flex items-center gap-1.5" style={{ paddingLeft: `${(i % 3) * 12}px` }}>
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-3" style={{ width: `${w}px` }} />
              </div>
            ))}
          </div>
          {/* Agent pipeline */}
          <div className="space-y-1.5 pt-3 border-t">
            <Skeleton className="h-3 w-20 mb-2" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-10 rounded-full ml-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel skeleton */}
        <div className="w-[30%] min-w-[280px] border-r flex flex-col">
          <div className="h-10 border-b px-3 flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-8 rounded-full ml-auto" />
          </div>
          <div className="flex-1 p-3 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <div className="space-y-1 flex-1 max-w-[80%]">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </div>
          </div>
          <div className="p-3 border-t">
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>

        {/* Right panel skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Tab bar */}
          <div className="h-10 border-b px-2 flex items-center gap-1">
            {["Code", "Preview", "Logs", "Terminal"].map((t) => (
              <Skeleton key={t} className="h-7 w-16 rounded-md" />
            ))}
          </div>
          {/* Editor skeleton */}
          <div className="flex-1 p-4 space-y-1.5">
            {Array.from({ length: 16 }, (_, i) => {
              // Deterministic "random-looking" widths to avoid hydration mismatch
              const widths = [78, 68, 82, 74, 58, 65, 53, 70, 65, 77, 31, 36, 71, 43, 56, 62];
              return (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-3.5 w-6" />
                  <Skeleton
                    className="h-3.5"
                    style={{ width: `${widths[i]}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
