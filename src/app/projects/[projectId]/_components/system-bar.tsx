/**
 * @file _components/system-bar.tsx
 * @description Unified 56px sticky system bar — project name, environment badge,
 * active agent pulse, progress bar, CPU/memory mini indicators,
 * token usage meter with cost, and Deploy button.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Rocket,
  Cpu,
  HardDrive,
  Coins,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSandboxStore } from "@/stores/sandbox-store";
import type { Project } from "@/types";
import type { WorkspacePhase } from "@/hooks/use-workspace-state";

/* ─── Props ─── */
interface SystemBarProps {
  project: Project;
  phase: WorkspacePhase;
  latestStatus: string | null;
  currentAgent: string | null;
  onOpenDeploy: () => void;
  onOpenTokenModal: () => void;
}

/* ─── Phase config ─── */
const phaseConfig: Record<
  WorkspacePhase,
  { label: string; color: string; bgColor: string; progress: number }
> = {
  idle: { label: "Idle", color: "text-muted-foreground", bgColor: "bg-muted", progress: 0 },
  planning: { label: "Planning", color: "text-blue-400", bgColor: "bg-blue-500/10", progress: 10 },
  coding: { label: "Coding", color: "text-blue-400", bgColor: "bg-blue-500/10", progress: 40 },
  building: { label: "Building", color: "text-amber-400", bgColor: "bg-amber-500/10", progress: 65 },
  debugging: { label: "Debugging", color: "text-orange-400", bgColor: "bg-orange-500/10", progress: 80 },
  verifying: { label: "Verifying", color: "text-purple-400", bgColor: "bg-purple-500/10", progress: 90 },
  completed: { label: "Completed", color: "text-emerald-400", bgColor: "bg-emerald-500/10", progress: 100 },
  error: { label: "Error", color: "text-red-400", bgColor: "bg-red-500/10", progress: 0 },
};

/* ─── Agent display names ─── */
const agentDisplayNames: Record<string, string> = {
  planner: "Planner",
  coder: "Developer",
  builder: "Builder",
  debugger: "Debugger",
  verifier: "Verifier",
};

/* ─── Mini usage bar ─── */
function MiniUsageBar({
  value,
  icon: Icon,
  label,
}: {
  value: number;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <div className="w-8 h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full transition-colors",
                value > 80 ? "bg-red-400" : value > 50 ? "bg-amber-400" : "bg-blue-400",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${value}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground font-mono tabular-nums w-5 text-right">
            {value}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}: {value}%
      </TooltipContent>
    </Tooltip>
  );
}

/* ─── Token cost estimate ─── */
function estimateCost(tokens: number): string {
  // ~$0.002 per 1K tokens (rough average)
  const cost = (tokens / 1000) * 0.002;
  if (cost < 0.01) return "<$0.01";
  return `$${cost.toFixed(2)}`;
}

/* ─── Component ─── */
export function SystemBar({
  project,
  phase,
  latestStatus,
  currentAgent,
  onOpenDeploy,
  onOpenTokenModal,
}: SystemBarProps) {
  const { executionPaused, toggleExecutionPaused } = useWorkspaceStore();
  const { cpuUsage, memoryUsage, tokensUsed, tokensLimit, deployStatus } =
    useSandboxStore();

  const cfg = phaseConfig[phase];
  const isActive =
    phase !== "idle" && phase !== "completed" && phase !== "error";
  const agentName = currentAgent
    ? agentDisplayNames[currentAgent.toLowerCase()] ?? currentAgent
    : null;
  const tokenPercent = Math.min((tokensUsed / tokensLimit) * 100, 100);

  // Animated progress that smoothly increments during active phases
  const [displayProgress, setDisplayProgress] = useState(cfg.progress);
  useEffect(() => {
    setDisplayProgress(cfg.progress);
  }, [cfg.progress]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setDisplayProgress((p) => {
        const target = cfg.progress;
        const next = target + 5; // allow slight overshoot for animation
        if (p >= next) return p;
        return Math.min(p + 0.3, next);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isActive, cfg.progress]);

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-md px-3 shrink-0 select-none shadow-sm shadow-black/5">
        {/* ─── Left: Nav + Project + Status ─── */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <Logo showText={false} />

          <Separator orientation="vertical" className="h-5" />

          <h1 className="text-sm font-semibold truncate max-w-[160px]">
            {project.name}
          </h1>

          {/* Environment status badge */}
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-2 py-0.5 font-medium gap-1 shrink-0",
              cfg.bgColor,
              cfg.color,
            )}
          >
            {phase === "error" && <AlertCircle className="h-2.5 w-2.5" />}
            {phase === "completed" && <CheckCircle2 className="h-2.5 w-2.5" />}
            {isActive && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
            {cfg.label}
          </Badge>

          {/* Active agent indicator with pulse */}
          <AnimatePresence mode="wait">
            {isActive && agentName && (
              <motion.div
                key={agentName}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="hidden lg:flex items-center gap-1.5 shrink-0"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
                </span>
                <span className="text-[11px] font-medium text-blue-400">
                  {agentName}
                </span>
                {latestStatus && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                    — {latestStatus}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Center: Progress bar ─── */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-6">
          <div className="flex-1 relative">
            <Progress
              value={displayProgress}
              className="h-1.5 bg-secondary"
            />
            {isActive && displayProgress > 0 && (
              <motion.span
                className="absolute right-0 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50"
                style={{ left: `${displayProgress}%` }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-8 text-right">
            {Math.round(displayProgress)}%
          </span>
        </div>

        {/* ─── Right: CPU/Mem + Tokens + Controls + Deploy ─── */}
        <div className="flex items-center gap-2">
          {/* CPU / Memory mini indicators */}
          <div className="hidden xl:flex items-center gap-2.5">
            <MiniUsageBar value={cpuUsage} icon={Cpu} label="CPU" />
            <MiniUsageBar value={memoryUsage} icon={HardDrive} label="Memory" />
          </div>

          <Separator orientation="vertical" className="h-5 hidden xl:block" />

          {/* Token usage meter */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenTokenModal}
                className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
              >
                <Coins className="h-3 w-3 text-muted-foreground" />
                <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      tokenPercent > 90
                        ? "bg-red-400"
                        : tokenPercent > 70
                          ? "bg-amber-400"
                          : "bg-emerald-400",
                    )}
                    style={{ width: `${tokenPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground font-mono">
                  {(tokensUsed / 1000).toFixed(1)}k
                </span>
                <span className="text-[9px] text-muted-foreground/50">
                  {estimateCost(tokensUsed)}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Token usage: {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} — Click for details
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5 hidden sm:block" />

          {/* Execution control */}
          {isActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleExecutionPaused}
                >
                  {executionPaused ? (
                    <Play className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Pause className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {executionPaused ? "Resume" : "Pause"} execution
              </TooltipContent>
            </Tooltip>
          )}

          <ThemeToggle />

          {/* Deploy button */}
          <Button
            size="sm"
            className="gap-1.5 text-xs h-8 px-3 shadow-sm"
            onClick={onOpenDeploy}
            disabled={deployStatus === "deploying"}
          >
            {deployStatus === "deploying" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Rocket className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
              {deployStatus === "deploying" ? "Deploying..." : "Deploy"}
            </span>
          </Button>
        </div>
      </header>
    </TooltipProvider>
  );
}
