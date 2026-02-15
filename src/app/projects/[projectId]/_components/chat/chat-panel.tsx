/**
 * @file _components/chat/chat-panel.tsx
 * @description The chat panel — displays message history and allows
 * sending follow-up prompts to the AI agent.
 *
 * Uses tRPC to send messages and invalidates the project query on success.
 */

"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { toast } from "sonner";

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
}

export function ChatPanel({
  projectId,
  messages,
  isGenerating,
  latestStatus,
}: ChatPanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  /** Send a follow-up message. */
  const sendMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        // Refetch the project data to get the new message
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, latestStatus]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-4"
      >
        <MessageList messages={messages} />

        {/* Typing indicator during generation */}
        {isGenerating && (
          <TypingIndicator status={latestStatus} />
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSend={(prompt) =>
          sendMessage.mutate({ prompt, projectId })
        }
        disabled={sendMessage.isPending || isGenerating}
        placeholder={
          isGenerating
            ? "AI is generating..."
            : "Send a follow-up message..."
        }
      />
    </div>
  );
}
