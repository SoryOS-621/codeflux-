"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { ThinkingIndicator } from "./thinking-indicator";
import type { MessageWithFragment } from "@/lib/types";
import { MAX_PROMPT_LENGTH } from "@/lib/constants";

interface ChatPanelProps {
  messages: MessageWithFragment[];
  isLoading: boolean;
  isSending: boolean;
  isAgentWorking: boolean;
  onSendMessage: (content: string) => void;
  onViewFragment?: (message: MessageWithFragment) => void;
}

export function ChatPanel({
  messages,
  isLoading,
  isSending,
  isAgentWorking,
  onSendMessage,
  onViewFragment,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isAgentWorking]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    onSendMessage(trimmed);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-10 border-b border-border flex items-center px-4 shrink-0">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Chat
        </h3>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {isLoading ? (
            <div className="flex flex-col gap-3 px-4 py-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="size-7 rounded-lg bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded bg-muted animate-pulse w-3/4" />
                    <div className="h-4 rounded bg-muted animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              Start a conversation to build something.
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onViewFragment={onViewFragment}
              />
            ))
          )}

          {isAgentWorking && <ThinkingIndicator />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              maxLength={MAX_PROMPT_LENGTH}
              rows={1}
              disabled={isSending || isAgentWorking}
              className="w-full resize-none bg-accent/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors disabled:opacity-50"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSending || isAgentWorking || !input.trim()}
            size="sm"
            className="shrink-0 h-9 w-9 p-0"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
