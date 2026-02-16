/**
 * @file _components/chat/typing-indicator.tsx
 * @description Premium typing indicator — animated bot avatar with status text,
 * streaming dots animation, and subtle glow effect.
 */

"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface TypingIndicatorProps {
  status: string | null;
}

export function TypingIndicator({ status }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      {/* Animated avatar */}
      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
        <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-lg animate-ping bg-blue-400/10" />
      </div>

      {/* Status bubble */}
      <div className="flex items-center gap-2.5 rounded-xl bg-card border border-border/50 px-3.5 py-2.5 ai-active-glow">
        {/* Typing dots */}
        <div className="flex items-center gap-0.5">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-blue-400" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-blue-400" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-blue-400" />
        </div>
        <span className="text-sm text-muted-foreground">
          {status || "Thinking..."}
        </span>
      </div>
    </motion.div>
  );
}
