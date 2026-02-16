/**
 * @file _components/sidebar/agent-status-panel.tsx
 * @description Enhanced agent pipeline with progress percentages, flow visualization,
 * and real-time status — Planner → Developer → Builder → Debugger → Complete.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Code2,
  TestTubes,
  Wrench,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspacePhase } from "@/hooks/use-workspace-state";

interface AgentDef {
  id: string;
  name: string;
  icon: React.ElementType;
  phases: WorkspacePhase[];
  description: string;
}

const agents: AgentDef[] = [
  { id: "planner", name: "Planner", icon: Brain, phases: ["planning"], description: "Architecture & file layout" },
  { id: "developer", name: "Developer", icon: Code2, phases: ["coding"], description: "Writing source code" },
  { id: "builder", name: "Builder", icon: Wrench, phases: ["building"], description: "Install deps & compile" },
  { id: "debugger", name: "Debugger", icon: TestTubes, phases: ["debugging", "verifying"], description: "Fix errors & verify" },
  { id: "done", name: "Complete", icon: CheckCircle2, phases: ["completed"], description: "All tasks finished" },
];

function getAgentStatus(
  agent: AgentDef,
  currentPhase: WorkspacePhase,
  phaseOrder: WorkspacePhase[]
): "idle" | "running" | "done" | "error" {
  if (currentPhase === "error") {
    const currentIdx = phaseOrder.indexOf(currentPhase);
    const agentPhaseIdx = Math.max(...agent.phases.map((p) => phaseOrder.indexOf(p)));
    if (agentPhaseIdx <= currentIdx) return "error";
    return "idle";
  }

  const currentIdx = phaseOrder.indexOf(currentPhase);
  const agentPhaseIdxes = agent.phases.map((p) => phaseOrder.indexOf(p));
  const minIdx = Math.min(...agentPhaseIdxes);
  const maxIdx = Math.max(...agentPhaseIdxes);

  if (currentIdx > maxIdx) return "done";
  if (currentIdx >= minIdx && currentIdx <= maxIdx) return "running";
  return "idle";
}

const phaseOrder: WorkspacePhase[] = [
  "idle",
  "planning",
  "coding",
  "building",
  "debugging",
  "verifying",
  "completed",
  "error",
];

interface AgentItemProps {
  agent: AgentDef;
  status: "idle" | "running" | "done" | "error";
  isLast: boolean;
  latestStatus?: string | null;
  progress: number;
}

function AgentItem({ agent, status, isLast, latestStatus, progress }: AgentItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const Icon = agent.icon;

  useEffect(() => {
    if (status !== "running") return;
    setElapsed(0);
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const cfg = {
    idle: {
      badge: "bg-secondary text-muted-foreground",
      label: "Idle",
      iconColor: "text-muted-foreground",
      dotBg: "bg-secondary",
      progressColor: "bg-muted-foreground/20",
    },
    running: {
      badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      label: "Active",
      iconColor: "text-blue-400",
      dotBg: "bg-blue-500/10",
      progressColor: "bg-blue-500",
    },
    done: {
      badge: "bg-emerald-500/10 text-emerald-400",
      label: "Done",
      iconColor: "text-emerald-400",
      dotBg: "bg-emerald-500/10",
      progressColor: "bg-emerald-500",
    },
    error: {
      badge: "bg-red-500/10 text-red-400",
      label: "Error",
      iconColor: "text-red-400",
      dotBg: "bg-red-500/10",
      progressColor: "bg-red-500",
    },
  }[status];

  return (
    <div className="relative">
      {/* Vertical connector */}
      {!isLast && (
        <div className="absolute left-[15px] top-[36px] flex flex-col items-center gap-0 z-0">
          <div
            className={cn(
              "w-px h-4",
              status === "done"
                ? "bg-gradient-to-b from-emerald-400/40 to-emerald-400/10"
                : "bg-border"
            )}
          />
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "relative z-10 flex items-center gap-2.5 w-full py-1.5 px-1 rounded-md text-left transition-all duration-200",
          "hover:bg-accent/50",
          status === "running" && "bg-blue-500/5"
        )}
      >
        {/* Agent icon with ring */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "flex h-[30px] w-[30px] items-center justify-center rounded-full transition-all duration-300",
              cfg.dotBg,
              status === "running" && "ring-2 ring-blue-500/30 ring-offset-1 ring-offset-background"
            )}
          >
            {status === "running" ? (
              <Loader2 className={cn("h-3.5 w-3.5 animate-spin", cfg.iconColor)} />
            ) : status === "error" ? (
              <AlertTriangle className={cn("h-3.5 w-3.5", cfg.iconColor)} />
            ) : (
              <Icon className={cn("h-3.5 w-3.5", cfg.iconColor)} />
            )}
          </div>
          {/* Pulse overlay when running */}
          {status === "running" && (
            <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
          )}
        </div>

        {/* Agent info + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">{agent.name}</span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", cfg.badge)}>
              {cfg.label}
            </span>
            {status === "running" && (
              <span className="text-[9px] text-blue-400 font-mono ml-auto">{progress}%</span>
            )}
            {status === "done" && (
              <span className="text-[9px] text-emerald-400 font-mono ml-auto">100%</span>
            )}
          </div>
          {/* Progress bar */}
          {(status === "running" || status === "done") && (
            <div className="h-1 w-full bg-secondary rounded-full mt-1 overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", cfg.progressColor)}
                initial={{ width: 0 }}
                animate={{ width: `${status === "done" ? 100 : progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          )}
          {status === "running" && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                {elapsed}s
              </span>
            </div>
          )}
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden ml-10"
          >
            <div className="py-1.5 px-2 text-[10px] text-muted-foreground bg-secondary/50 rounded-md my-1 space-y-1">
              <p className="text-[10px] text-muted-foreground/70">{agent.description}</p>
              <div className="font-mono leading-relaxed">
                {status === "running" && latestStatus ? (
                  <span className="text-blue-400">{latestStatus}</span>
                ) : status === "idle" ? (
                  "Waiting to start..."
                ) : status === "running" ? (
                  "Processing current task..."
                ) : status === "done" ? (
                  "Completed successfully."
                ) : (
                  "An error occurred during execution."
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AgentStatusPanelProps {
  phase: WorkspacePhase;
  latestStatus?: string | null;
  currentAgent?: string | null;
}

export function AgentStatusPanel({ phase, latestStatus, currentAgent: _currentAgent }: AgentStatusPanelProps) {
  const [runningProgress, setRunningProgress] = useState(0);

  // Simulate progress while an agent is running
  useEffect(() => {
    if (phase === "idle" || phase === "completed" || phase === "error") {
      setRunningProgress(0);
      return;
    }
    setRunningProgress(5);
    const interval = setInterval(() => {
      setRunningProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 3;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [phase]);

  // Overall pipeline progress
  const overallProgress = useMemo(() => {
    const idx = phaseOrder.indexOf(phase);
    if (phase === "completed") return 100;
    if (phase === "idle") return 0;
    // Each agent step is ~20%
    const base = Math.max(0, idx - 1) * 20;
    return Math.min(base + (runningProgress / 100) * 20, 99);
  }, [phase, runningProgress]);

  return (
    <div>
      {/* Header with overall progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Agent Pipeline
        </span>
        {phase !== "idle" && (
          <span className="text-[9px] font-mono text-muted-foreground">
            {Math.round(overallProgress)}%
          </span>
        )}
      </div>

      {/* Overall progress bar */}
      {phase !== "idle" && (
        <div className="h-1 w-full bg-secondary rounded-full mb-3 overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              phase === "completed"
                ? "bg-emerald-500"
                : phase === "error"
                  ? "bg-red-500"
                  : "bg-blue-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}

      {/* Agent items */}
      <div className="space-y-0.5">
        {agents.map((agent, idx) => {
          const status = getAgentStatus(agent, phase, phaseOrder);
          const isThisAgent = status === "running";
          return (
            <AgentItem
              key={agent.id}
              agent={agent}
              status={status}
              isLast={idx === agents.length - 1}
              latestStatus={isThisAgent ? latestStatus : null}
              progress={isThisAgent ? Math.round(runningProgress) : 0}
            />
          );
        })}
      </div>
    </div>
  );
}
