/**
 * @file components/shared/relative-time.tsx
 * @description Renders a timestamp as a human-readable relative string
 * (e.g. "2 minutes ago"). Uses date-fns which is already installed.
 */

"use client";

import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface RelativeTimeProps {
  date: Date | string;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const d = typeof date === "string" ? new Date(date) : date;

  return (
    <time
      dateTime={d.toISOString()}
      title={d.toLocaleString()}
      className={cn("text-xs text-muted-foreground", className)}
    >
      {formatDistanceToNow(d, { addSuffix: true })}
    </time>
  );
}
