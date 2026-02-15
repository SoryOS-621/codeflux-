/**
 * @file _components/chat/message-bubble.tsx
 * @description Renders a single chat message bubble — user or assistant.
 *
 * - USER messages: right-aligned, primary color
 * - ASSISTANT messages: left-aligned, rendered as markdown
 * - ERROR messages: red-tinted
 */

import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { User, Bot, AlertTriangle, FileCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message & {
    fragment?: {
      id: string;
      sandboxUrl: string;
      title: string;
      files: Record<string, string>;
    } | null;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "USER";
  const isError = message.type === "ERROR";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : isError
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground",
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : isError ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[85%]",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : isError
                ? "bg-destructive/10 border border-destructive/20"
                : "bg-muted",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Fragment chip */}
        {message.fragment && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <FileCode className="h-3 w-3" />
            {message.fragment.title} ({Object.keys(message.fragment.files).length} files)
          </Badge>
        )}
      </div>
    </div>
  );
}
