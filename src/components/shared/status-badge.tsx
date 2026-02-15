/**
 * @file components/shared/status-badge.tsx
 * @description Colored badge indicating project status (IDLE / GENERATING).
 */

import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isGenerating = status === "GENERATING";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        isGenerating
          ? "bg-amber-500/10 text-amber-500"
          : "bg-emerald-500/10 text-emerald-500",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isGenerating ? "bg-amber-500 animate-pulse" : "bg-emerald-500",
        )}
      />
      {isGenerating ? "Generating" : "Idle"}
    </span>
  );
}
