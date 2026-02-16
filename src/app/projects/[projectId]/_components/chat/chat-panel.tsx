/**
 * @file _components/chat/chat-panel.tsx
 * @description Execution Intelligence Panel — replaces plain chat with
 * grouped execution stages (USER, PLAN, CODE, BUILD, FIX, SUMMARY), 
 * auto-generated summaries, collapsible stages, and chat input.
 */

"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect, useMemo, useState, type RefObject } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Brain,
  Code2,
  Wrench,
  Bug,
  CheckCircle2,
  ChevronDown,
  User,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import type { Message } from "@/types";
import type { WorkspacePhase } from "@/hooks/use-workspace-state";

/* ─── Stage definitions ─── */
type StageType = "user" | "plan" | "code" | "build" | "fix" | "summary";

interface StageConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const stageConfigs: Record<StageType, StageConfig> = {
  user: { label: "User Request", icon: User, color: "text-primary", bgColor: "bg-primary/5" },
  plan: { label: "Planning", icon: Brain, color: "text-blue-400", bgColor: "bg-blue-500/5" },
  code: { label: "Code Generation", icon: Code2, color: "text-emerald-400", bgColor: "bg-emerald-500/5" },
  build: { label: "Build & Install", icon: Wrench, color: "text-amber-400", bgColor: "bg-amber-500/5" },
  fix: { label: "Debug & Fix", icon: Bug, color: "text-purple-400", bgColor: "bg-purple-500/5" },
  summary: { label: "Summary", icon: CheckCircle2, color: "text-emerald-400", bgColor: "bg-emerald-500/5" },
};

interface MessageGroup {
  stage: StageType;
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
  autoSummary: string | null;
}

/** Derive stage type from a message */
function classifyMessage(
  msg: Message,
  prevStage: StageType | null
): StageType {
  if (msg.role === "USER") return "user";
  if (msg.type === "ERROR") return "fix";

  const content = msg.content.toLowerCase();

  // Simple classification based on content
  if (content.includes("plan") || content.includes("architecture") || content.includes("structure") || content.includes("approach")) {
    return "plan";
  }
  if (content.includes("created") || content.includes("wrote") || content.includes("generating") || content.includes("file")) {
    return "code";
  }
  if (content.includes("building") || content.includes("installing") || content.includes("npm") || content.includes("dependency")) {
    return "build";
  }
  if (content.includes("fix") || content.includes("error") || content.includes("debug") || content.includes("retry")) {
    return "fix";
  }
  if (content.includes("complete") || content.includes("summary") || content.includes("ready") || content.includes("deployed")) {
    return "summary";
  }

  // Default: follow previous stage or plan
  return prevStage ?? "plan";
}

/** Generate auto-summary for a message group */
function generateSummary(group: MessageGroup): string | null {
  const { stage, messages } = group;
  const count = messages.length;
  if (count === 0) return null;

  switch (stage) {
    case "user":
      return null; // No summary for user messages
    case "plan":
      return `Planned architecture and ${count} response${count !== 1 ? "s" : ""} generated`;
    case "code": {
      const filesWritten = messages.filter(m => m.fragment).length;
      return filesWritten > 0
        ? `Generated code across ${filesWritten} fragment${filesWritten !== 1 ? "s" : ""}`
        : `${count} code generation response${count !== 1 ? "s" : ""}`;
    }
    case "build":
      return `Build process: ${count} update${count !== 1 ? "s" : ""}`;
    case "fix":
      return `Applied ${count} fix${count !== 1 ? "es" : ""} to resolve issues`;
    case "summary":
      return "Task completed successfully";
    default:
      return null;
  }
}

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
  phase?: WorkspacePhase;
}

export function ChatPanel({
  projectId,
  messages,
  isGenerating,
  latestStatus,
  chatInputRef,
  phase: _phase,
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

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, latestStatus]);

  // Group messages into stages
  const messageGroups = useMemo(() => {
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    for (const msg of messages) {
      const stage = classifyMessage(msg, currentGroup?.stage ?? null);

      if (!currentGroup || currentGroup.stage !== stage) {
        // Finalize previous group
        if (currentGroup) {
          currentGroup.autoSummary = generateSummary(currentGroup);
        }
        currentGroup = { stage, messages: [msg], autoSummary: null };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(msg);
      }
    }

    // Finalize last group
    if (currentGroup) {
      currentGroup.autoSummary = generateSummary(currentGroup);
    }

    return groups;
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 h-10 px-4 border-b shrink-0">
        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">Execution</span>
        {messageGroups.length > 0 && (
          <span className="text-[10px] text-muted-foreground/50 ml-auto">
            {messageGroups.length} stage{messageGroups.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Grouped messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin"
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

        {messageGroups.map((group, gIdx) => (
          <ExecutionStage key={`stage-${gIdx}`} group={group} isLast={gIdx === messageGroups.length - 1} />
        ))}

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

/* ─── ExecutionStage — a collapsible group of messages ─── */
function ExecutionStage({ group, isLast: _isLast }: { group: MessageGroup; isLast: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const config = stageConfigs[group.stage];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("rounded-lg border overflow-hidden", config.bgColor)}
    >
      {/* Stage header — clickable to collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent/30 transition-colors text-left"
      >
        <div className={cn("flex h-5 w-5 items-center justify-center rounded", config.color)}>
          <Icon className="h-3 w-3" />
        </div>
        <span className={cn("text-xs font-medium flex-1", config.color)}>
          {config.label}
        </span>
        <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
          {group.messages.length}
        </Badge>
        <motion.div
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Messages */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {group.messages.map((msg, idx) => (
                <MessageBubble key={msg.id} message={msg} index={idx} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-summary when collapsed */}
      <AnimatePresence>
        {collapsed && group.autoSummary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-2"
          >
            <p className="text-[10px] text-muted-foreground italic">
              {group.autoSummary}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
