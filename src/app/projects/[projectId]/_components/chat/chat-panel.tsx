/**
 * @file _components/chat/chat-panel.tsx
 * @description Premium chat panel — message history with auto-scroll,
 * streaming-ready layout, and seamless input integration.
 */

"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect, type RefObject } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import type { Message } from "@/types";

interface ChatPanelProps {
  projectId: string;
  messages: Array<
    Message & {
      fragment?: {
        id: string;
        sandboxUrl: string;
        title: string;
        files: Record<string, string>;
      } | null;
    }
  >;
  isGenerating: boolean;
  latestStatus: string | null;
  chatInputRef?: RefObject<HTMLTextAreaElement | null>;
}

export function ChatPanel({
  projectId,
  messages,
  isGenerating,
  latestStatus,
  chatInputRef,
}: ChatPanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.projects.getOne.queryKey({ projectId }),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, latestStatus]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Chat header */}
      <div className="flex items-center gap-2 h-10 px-4 border-b shrink-0">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Chat</span>
        {messages.length > 0 && (
          <span className="text-[10px] text-muted-foreground/50 ml-auto">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
      >
        {messages.length === 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center gap-3"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60">
                Send a follow-up to modify your project
              </p>
            </div>
          </motion.div>
        )}

        <MessageList messages={messages} />

        {isGenerating && (
          <TypingIndicator status={latestStatus} />
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={(prompt) => sendMessage.mutate({ prompt, projectId })}
        disabled={sendMessage.isPending || isGenerating}
        placeholder={
          isGenerating
            ? "AI is generating..."
            : "Send a follow-up message..."
        }
        inputRef={chatInputRef}
      />
    </div>
  );
}
