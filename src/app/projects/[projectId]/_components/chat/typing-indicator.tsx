/**
 * @file _components/chat/typing-indicator.tsx
 * @description Animated indicator shown when the AI agent is working.
 *
 * Displays the latest agent status message with a pulsing animation.
 */

import { Bot, Loader2 } from "lucide-react";

interface TypingIndicatorProps {
  status: string | null;
}

export function TypingIndicator({ status }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {status || "AI is thinking..."}
        </span>
      </div>
    </div>
  );
}
