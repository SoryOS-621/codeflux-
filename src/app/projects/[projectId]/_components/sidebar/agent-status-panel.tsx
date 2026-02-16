/**
 * @file _components/sidebar/agent-status-panel.tsx
 * @description Visual pipeline showing Planner → Developer → Tester → Fixer → Done.
 * Each agent shows status badge, execution time, and expandable logs.
 */

"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspacePhase } from "@/hooks/use-workspace-state";

interface AgentDef {
  id: string;
  name: string;
  icon: React.ElementType;
  phases: WorkspacePhase[];
}

const agents: AgentDef[] = [
  { id: "planner", name: "Planner", icon: Brain, phases: ["planning"] },
  { id: "developer", name: "Developer", icon: Code2, phases: ["coding"] },
  { id: "builder", name: "Builder", icon: Wrench, phases: ["building"] },
  { id: "debugger", name: "Debugger", icon: TestTubes, phases: ["debugging", "verifying"] },
  { id: "done", name: "Complete", icon: CheckCircle2, phases: ["completed"] },
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
}

function AgentItem({ agent, status, isLast }: AgentItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const Icon = agent.icon;

  // Mock timer when running
  useEffect(() => {
    if (status !== "running") return;
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const statusConfig = {
    idle: {
      badge: "bg-secondary text-muted-foreground",
      label: "Idle",
      iconColor: "text-muted-foreground",
      dotColor: "bg-muted-foreground/40",
    },
    running: {
      badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      label: "Running",
      iconColor: "text-blue-400",
      dotColor: "bg-blue-400",
    },
    done: {
      badge: "bg-emerald-500/10 text-emerald-400",
      label: "Done",
      iconColor: "text-emerald-400",
      dotColor: "bg-emerald-400",
    },
    error: {
      badge: "bg-red-500/10 text-red-400",
      label: "Error",
      iconColor: "text-red-400",
      dotColor: "bg-red-400",
    },
  };

  const cfg = statusConfig[status];

  return (
    <div className="relative">
      {/* Connection line */}
      {!isLast && (
        <div
          className={cn(
            "absolute left-[15px] top-[28px] w-px h-[calc(100%-16px)]",
            status === "done" ? "bg-emerald-400/30" : "bg-border"
          )}
        />
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2.5 w-full py-1.5 px-1 rounded-md text-left transition-all duration-200",
          "hover:bg-accent/50",
          status === "running" && "ai-active-glow"
        )}
      >
        {/* Agent icon */}
        <div
          className={cn(
            "relative flex h-[30px] w-[30px] items-center justify-center rounded-lg shrink-0",
            status === "running"
              ? "bg-blue-500/10 animate-pulse-glow"
              : "bg-secondary"
          )}
        >
          {status === "running" ? (
            <Loader2 className={cn("h-3.5 w-3.5 animate-spin", cfg.iconColor)} />
          ) : (
            <Icon className={cn("h-3.5 w-3.5", cfg.iconColor)} />
          )}
        </div>

        {/* Agent info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">{agent.name}</span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", cfg.badge)}>
              {cfg.label}
            </span>
          </div>
          {status === "running" && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                {elapsed}s
              </span>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded logs */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden ml-10"
          >
            <div className="py-1.5 px-2 text-[10px] text-muted-foreground bg-secondary/50 rounded-md my-1 font-mono">
              {status === "idle" && "Waiting to start..."}
              {status === "running" && "Processing current task..."}
              {status === "done" && "Completed successfully."}
              {status === "error" && "An error occurred during execution."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AgentStatusPanelProps {
  phase: WorkspacePhase;
}

export function AgentStatusPanel({ phase }: AgentStatusPanelProps) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
        Agent Pipeline
      </span>
      <div className="space-y-0.5">
        {agents.map((agent, idx) => (
          <AgentItem
            key={agent.id}
            agent={agent}
            status={getAgentStatus(agent, phase, phaseOrder)}
            isLast={idx === agents.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
