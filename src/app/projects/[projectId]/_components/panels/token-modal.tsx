/**
 * @file _components/panels/token-modal.tsx
 * @description Token awareness modal — shows detailed token breakdown,
 * prompt context, cost estimate, and auto-trim context button.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Coins,
  FileText,
  MessageSquare,
  Scissors,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useSandboxStore } from "@/stores/sandbox-store";

interface TokenModalProps {
  open: boolean;
  onClose: () => void;
  messageCount: number;
  fileCount: number;
}

interface TokenBreakdown {
  label: string;
  icon: React.ElementType;
  tokens: number;
  color: string;
}

function estimateCost(tokens: number): string {
  // ~$0.003 per 1k input tokens (GPT-4 class)
  return (tokens * 0.003 / 1000).toFixed(4);
}

export function TokenModal({ open, onClose, messageCount, fileCount }: TokenModalProps) {
  const { tokensUsed, tokensLimit } = useSandboxStore();
  const percent = Math.min((tokensUsed / tokensLimit) * 100, 100);

  // Estimate breakdown
  const chatTokens = Math.round(tokensUsed * 0.35);
  const fileTokens = Math.round(tokensUsed * 0.45);
  const systemTokens = Math.round(tokensUsed * 0.15);
  const overheadTokens = tokensUsed - chatTokens - fileTokens - systemTokens;

  const breakdown: TokenBreakdown[] = [
    { label: "Chat messages", icon: MessageSquare, tokens: chatTokens, color: "bg-blue-500" },
    { label: "Files in context", icon: FileText, tokens: fileTokens, color: "bg-emerald-500" },
    { label: "System prompt", icon: Coins, tokens: systemTokens, color: "bg-purple-500" },
    { label: "Overhead", icon: TrendingDown, tokens: overheadTokens, color: "bg-muted-foreground" },
  ];

  const isNearLimit = percent > 75;
  const isOverLimit = percent > 95;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] max-h-[85vh] bg-background border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-12 px-4 border-b shrink-0">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Token Usage</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Usage meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Usage</span>
                  <span className="text-xs font-mono">
                    {(tokensUsed / 1000).toFixed(1)}k / {(tokensLimit / 1000).toFixed(0)}k
                  </span>
                </div>
                <Progress
                  value={percent}
                  className={cn(
                    "h-2",
                    isOverLimit && "[&>div]:bg-red-500",
                    isNearLimit && !isOverLimit && "[&>div]:bg-amber-500",
                  )}
                />
                {isNearLimit && (
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <AlertTriangle className={cn("h-3 w-3", isOverLimit ? "text-red-400" : "text-amber-400")} />
                    <span className={isOverLimit ? "text-red-400" : "text-amber-400"}>
                      {isOverLimit ? "Token limit nearly exhausted" : "Approaching token limit"}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Breakdown
                </span>
                {breakdown.map((item) => {
                  const Icon = item.icon;
                  const itemPercent = tokensUsed > 0 ? (item.tokens / tokensUsed) * 100 : 0;
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={cn("h-2 w-2 rounded-full shrink-0", item.color)} />
                      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs flex-1">{item.label}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {(item.tokens / 1000).toFixed(1)}k
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 w-8 text-right">
                        {Math.round(itemPercent)}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Visual breakdown bar */}
              <div className="h-3 flex rounded-full overflow-hidden bg-secondary">
                {breakdown.map((item) => {
                  const width = tokensUsed > 0 ? (item.tokens / tokensUsed) * 100 : 0;
                  return (
                    <div
                      key={item.label}
                      className={cn("h-full transition-all duration-300", item.color)}
                      style={{ width: `${width}%` }}
                    />
                  );
                })}
              </div>

              <Separator />

              {/* Context details */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Context
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border bg-card/50 p-2.5 text-center">
                    <MessageSquare className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-lg font-medium">{messageCount}</p>
                    <p className="text-[10px] text-muted-foreground">Messages</p>
                  </div>
                  <div className="rounded-lg border bg-card/50 p-2.5 text-center">
                    <FileText className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-lg font-medium">{fileCount}</p>
                    <p className="text-[10px] text-muted-foreground">Files in context</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cost estimate */}
              <div className="rounded-lg border bg-card/50 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Estimated cost</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    ${estimateCost(tokensUsed)}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground/60">
                  Based on ~$0.003 / 1,000 input tokens (GPT-4 class model)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex gap-2 shrink-0">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 text-xs"
                size="sm"
              >
                <Scissors className="h-3 w-3" />
                Auto-trim Context
              </Button>
              <Button variant="ghost" className="text-xs" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
