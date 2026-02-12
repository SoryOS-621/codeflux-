"use client";

import { formatDistanceToNow } from "date-fns";
import { User, Bot, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageWithFragment } from "@/lib/types";

interface MessageBubbleProps {
  message: MessageWithFragment;
  onViewFragment?: (message: MessageWithFragment) => void;
}

export function MessageBubble({ message, onViewFragment }: MessageBubbleProps) {
  const isUser = message.role === "USER";
  const isError = message.type === "ERROR";

  return (
    <div className={cn("flex gap-3 px-4 py-3 group", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isUser
            ? "bg-primary/10 border border-primary/20"
            : isError
            ? "bg-destructive/10 border border-destructive/20"
            : "bg-accent border border-border"
        )}
      >
        {isUser ? (
          <User className="size-3.5 text-primary" />
        ) : isError ? (
          <AlertTriangle className="size-3.5 text-destructive" />
        ) : (
          <Bot className="size-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex flex-col gap-1.5 min-w-0 max-w-[85%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : isError
              ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm"
              : "bg-accent text-accent-foreground border border-border rounded-tl-sm"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Fragment action */}
        {message.fragment && onViewFragment && (
          <button
            onClick={() => onViewFragment(message)}
            className="text-xs text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
          >
            View generated app
          </button>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground/50 px-1">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
