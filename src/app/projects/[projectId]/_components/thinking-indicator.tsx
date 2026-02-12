"use client";

import { cn } from "@/lib/utils";

interface ThinkingIndicatorProps {
  className?: string;
}

export function ThinkingIndicator({ className }: ThinkingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 px-4 py-3", className)}>
      <div className="flex items-center gap-1">
        <div className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <div className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <div className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-muted-foreground">AI is working...</span>
    </div>
  );
}
