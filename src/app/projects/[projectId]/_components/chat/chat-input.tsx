/**
 * @file _components/chat/chat-input.tsx
 * @description Premium chat input — auto-expanding textarea with keyboard shortcut hints,
 * subtle glass effect, and animated send button.
 */

"use client";

import { useState, useRef, useCallback, type RefObject } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { SendHorizontal, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Send a follow-up message...",
  inputRef,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? internalRef;

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    const ref = inputRef ?? internalRef;
    if (ref.current) {
      ref.current.style.height = "auto";
    }
  }, [value, disabled, onSend, inputRef, internalRef]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  };

  const hasValue = value.trim().length > 0;

  return (
    <div className="border-t bg-card/50 p-3 shrink-0">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-xl border bg-background/80 transition-all duration-200",
          isFocused
            ? "ring-1 ring-primary/30 border-primary/20 shadow-sm shadow-primary/5"
            : "border-border/50",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {/* AI indicator */}
        {disabled && (
          <div className="absolute -top-2.5 left-3 flex items-center gap-1 bg-card px-1.5 py-0.5 rounded-full">
            <Sparkles className="h-2.5 w-2.5 text-primary animate-pulse" />
            <span className="text-[9px] font-medium text-primary">AI is thinking...</span>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent px-3.5 py-2.5 text-sm",
            "placeholder:text-muted-foreground/60 focus:outline-none",
            "disabled:cursor-not-allowed",
            "scrollbar-thin",
          )}
        />

        <div className="flex items-center gap-1 pr-2 pb-2">
          <motion.div
            initial={false}
            animate={{ scale: hasValue ? 1 : 0.9, opacity: hasValue ? 1 : 0.5 }}
          >
            <Button
              size="icon"
              className={cn(
                "h-7 w-7 rounded-lg transition-all duration-200",
                hasValue && !disabled && "bg-primary shadow-sm shadow-primary/20",
              )}
              onClick={handleSubmit}
              disabled={!hasValue || disabled}
            >
              <SendHorizontal className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[10px] text-muted-foreground/50">
          <Kbd>Enter</Kbd> send · <Kbd>Shift+Enter</Kbd> new line · <Kbd>Ctrl+K</Kbd> focus
        </span>
      </div>
    </div>
  );
}
