/**
 * @file _components/chat/message-bubble.tsx
 * @description Premium chat bubble — minimal, clean, with streaming-ready layout.
 *
 * - USER: right-aligned, subtle primary tint
 * - ASSISTANT: left-aligned, markdown, expandable reasoning, tool call chips
 * - ERROR: red accent
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import {
  User,
  Bot,
  AlertTriangle,
  FileCode,
  ChevronDown,
  Lightbulb,
  Coins,
} from "lucide-react";
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
  /** Index for staggered animation */
  index?: number;
}

export function MessageBubble({ message, index = 0 }: MessageBubbleProps) {
  const isUser = message.role === "USER";
  const isError = message.type === "ERROR";
  const [reasoningExpanded, setReasoningExpanded] = useState(false);

  // Mock token count based on content length
  const estimatedTokens = Math.ceil(message.content.length / 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
      className={cn(
        "flex gap-3 group",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
          isUser
            ? "bg-primary/10 text-primary"
            : isError
              ? "bg-destructive/10 text-destructive"
              : "bg-blue-500/10 text-blue-400",
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
          "flex flex-col gap-1.5 max-w-[85%] min-w-0",
          isUser ? "items-end" : "items-start",
        )}
      >
        {/* Label */}
        <span className="text-[10px] text-muted-foreground font-medium px-1">
          {isUser ? "You" : isError ? "Error" : "CodeFlux"}
        </span>

        {/* Bubble */}
        <div
          className={cn(
            "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : isError
                ? "bg-destructive/5 border border-destructive/15 rounded-tl-sm"
                : "bg-card border border-border/50 rounded-tl-sm",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Expandable reasoning section (mock) */}
        {!isUser && !isError && message.content.length > 200 && (
          <button
            onClick={() => setReasoningExpanded(!reasoningExpanded)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            <Lightbulb className="h-2.5 w-2.5" />
            <span>Reasoning</span>
            <motion.div
              animate={{ rotate: reasoningExpanded ? 180 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronDown className="h-2.5 w-2.5" />
            </motion.div>
          </button>
        )}

        {reasoningExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-muted/50 rounded-lg px-3 py-2 text-[11px] text-muted-foreground overflow-hidden"
          >
            Analyzed project structure, evaluated requirements, and selected optimal implementation approach.
          </motion.div>
        )}

        {/* Fragment chip + token count */}
        <div className="flex items-center gap-2 px-1">
          {message.fragment && (
            <Badge variant="secondary" className="gap-1 text-[10px] h-5 font-normal">
              <FileCode className="h-2.5 w-2.5" />
              {message.fragment.title} ({Object.keys(message.fragment.files).length} files)
            </Badge>
          )}
          {/* Token usage per message */}
          <span className="text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            <Coins className="h-2.5 w-2.5" />
            ~{estimatedTokens} tokens
          </span>
        </div>
      </div>
    </motion.div>
  );
}
