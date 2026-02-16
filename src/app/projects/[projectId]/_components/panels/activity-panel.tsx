/**
 * @file _components/panels/activity-panel.tsx
 * @description Right Activity Panel — live transparency feed of sandbox events,
 * build history, CPU/memory sparklines, and current active command.
 * Auto-updates from SSE events to show real-time execution timeline.
 */

"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Terminal,
  Zap,
  Cpu,
  HardDrive,
  Code2,
  Bug,
  FileCode,
  Server,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
// Button available for future use
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSandboxStore } from "@/stores/sandbox-store";
import type { AgentEvent } from "@/core/events/types";
import type { WorkspacePhase } from "@/hooks/use-workspace-state";

/* ─── Types ─── */
interface ActivityPanelProps {
  events: AgentEvent[];
  phase: WorkspacePhase;
  currentAgent: string | null;
  latestStatus: string | null;
}

interface TimelineEntry {
  id: string;
  icon: React.ElementType;
  label: string;
  detail?: string;
  timestamp: number;
  color: "blue" | "emerald" | "amber" | "red" | "purple" | "muted";
  category: "agent" | "build" | "terminal" | "file" | "error" | "debug";
}

/* ─── Color map ─── */
const colorMap = {
  blue: "text-blue-400 bg-blue-500/10",
  emerald: "text-emerald-400 bg-emerald-500/10",
  amber: "text-amber-400 bg-amber-500/10",
  red: "text-red-400 bg-red-500/10",
  purple: "text-purple-400 bg-purple-500/10",
  muted: "text-muted-foreground bg-muted",
};

const dotColorMap = {
  blue: "bg-blue-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  red: "bg-red-400",
  purple: "bg-purple-400",
  muted: "bg-muted-foreground/40",
};

/* ─── Build event → timeline entry ─── */
function eventToEntry(event: AgentEvent, idx: number): TimelineEntry | null {
  const base = { timestamp: event.timestamp, id: `evt-${idx}` };

  switch (event.type) {
    case "planning_started":
      return { ...base, icon: Zap, label: "Planning started", color: "blue", category: "agent" };
    case "planning_completed":
      return { ...base, icon: CheckCircle2, label: "Plan ready", detail: "Architecture & file structure planned", color: "emerald", category: "agent" };
    case "code_generation_started":
      return { ...base, icon: Code2, label: "Code generation started", color: "blue", category: "agent" };
    case "files_written": {
      const paths = (event.payload as { paths: string[] }).paths;
      return { ...base, icon: FileCode, label: `${paths.length} file${paths.length !== 1 ? "s" : ""} written`, detail: paths.slice(0, 3).join(", ") + (paths.length > 3 ? "..." : ""), color: "emerald", category: "file" };
    }
    case "terminal_command": {
      const cmd = (event.payload as { command: string }).command;
      return { ...base, icon: Terminal, label: "Command executed", detail: cmd.length > 60 ? cmd.slice(0, 60) + "..." : cmd, color: "blue", category: "terminal" };
    }
    case "execution_started":
      return { ...base, icon: Play, label: "Build started", color: "amber", category: "build" };
    case "execution_completed":
      return { ...base, icon: CheckCircle2, label: "Build succeeded", color: "emerald", category: "build" };
    case "execution_failed": {
      const error = (event.payload as { error?: string }).error;
      return { ...base, icon: AlertTriangle, label: "Build failed", detail: error?.slice(0, 80), color: "red", category: "error" };
    }
    case "debug_started":
      return { ...base, icon: Bug, label: "Debugger activated", color: "amber", category: "debug" };
    case "fix_applied": {
      const desc = (event.payload as { description?: string }).description;
      return { ...base, icon: Wrench, label: "Fix applied", detail: desc?.slice(0, 80), color: "purple", category: "debug" };
    }
    case "retrying": {
      const p = event.payload as { attempt: number; maxAttempts: number; reason?: string };
      return { ...base, icon: RotateCcw, label: `Retry ${p.attempt}/${p.maxAttempts}`, detail: p.reason, color: "amber", category: "debug" };
    }
    case "verification_started":
      return { ...base, icon: CheckCircle2, label: "Verification started", color: "purple", category: "agent" };
    case "verification_completed":
      return { ...base, icon: CheckCircle2, label: "Verification passed", color: "emerald", category: "agent" };
    case "preview_url_available":
      return { ...base, icon: Server, label: "Preview ready", detail: "Live sandbox URL available", color: "emerald", category: "build" };
    case "completed":
      return { ...base, icon: CheckCircle2, label: "All tasks completed", color: "emerald", category: "agent" };
    case "fatal_error": {
      const err = (event.payload as { error: string }).error;
      return { ...base, icon: AlertTriangle, label: "Fatal error", detail: err?.slice(0, 80), color: "red", category: "error" };
    }
    default:
      return null;
  }
}

/* ─── Format relative time ─── */
function formatRelativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

/* ─── Build History Entry ─── */
interface BuildRecord {
  id: string;
  startedAt: number;
  endedAt?: number;
  status: "running" | "success" | "failed";
  duration?: number;
}

/* ─── Sparkline ─── */
function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="w-full h-6" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ─── Component ─── */
export function ActivityPanel({ events, phase, currentAgent: _currentAgent, latestStatus }: ActivityPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { cpuUsage, memoryUsage } = useSandboxStore();
  const [showBuildHistory, setShowBuildHistory] = useState(false);

  // Generate historical sparkline data (simulated from store values)
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(0));
  const [memHistory, setMemHistory] = useState<number[]>(Array(20).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuHistory((prev) => [...prev.slice(-19), cpuUsage]);
      setMemHistory((prev) => [...prev.slice(-19), memoryUsage]);
    }, 2000);
    return () => clearInterval(interval);
  }, [cpuUsage, memoryUsage]);

  // Convert events to timeline entries
  const timeline = useMemo(() => {
    const entries: TimelineEntry[] = [];
    for (let i = 0; i < events.length; i++) {
      const entry = eventToEntry(events[i], i);
      if (entry) entries.push(entry);
    }
    return entries;
  }, [events]);

  // Derive build history
  const buildHistory = useMemo(() => {
    const builds: BuildRecord[] = [];
    for (const event of events) {
      if (event.type === "execution_started") {
        builds.push({
          id: `build-${builds.length}`,
          startedAt: event.timestamp,
          status: "running",
        });
      } else if (event.type === "execution_completed" && builds.length > 0) {
        const last = builds[builds.length - 1];
        last.status = "success";
        last.endedAt = event.timestamp;
        last.duration = Math.round((event.timestamp - last.startedAt) / 1000);
      } else if (event.type === "execution_failed" && builds.length > 0) {
        const last = builds[builds.length - 1];
        last.status = "failed";
        last.endedAt = event.timestamp;
        last.duration = Math.round((event.timestamp - last.startedAt) / 1000);
      }
    }
    return builds;
  }, [events]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [timeline.length]);

  // Time ticker for relative times
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-3 border-b shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Activity</span>
          {timeline.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              {timeline.length}
            </Badge>
          )}
        </div>
        {phase !== "idle" && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
          </span>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-3 space-y-4">
          {/* ─── Current Command ─── */}
          {latestStatus && phase !== "idle" && phase !== "completed" && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
                <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {latestStatus}
              </p>
            </div>
          )}

          {/* ─── CPU / Memory Sparklines ─── */}
          <div className="space-y-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Resources
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border bg-card/50 p-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Cpu className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">CPU</span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground">{cpuUsage}%</span>
                </div>
                <MiniSparkline values={cpuHistory} color="var(--color-blue-400, #60a5fa)" />
              </div>
              <div className="rounded-md border bg-card/50 p-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">MEM</span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground">{memoryUsage}%</span>
                </div>
                <MiniSparkline values={memHistory} color="var(--color-purple-400, #a78bfa)" />
              </div>
            </div>
          </div>

          <Separator />

          {/* ─── Build History ─── */}
          {buildHistory.length > 0 && (
            <div className="space-y-1.5">
              <button
                onClick={() => setShowBuildHistory(!showBuildHistory)}
                className="flex items-center justify-between w-full"
              >
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Build History ({buildHistory.length})
                </span>
                {showBuildHistory ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
              <AnimatePresence>
                {showBuildHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden space-y-1"
                  >
                    {buildHistory.map((build) => (
                      <div
                        key={build.id}
                        className="flex items-center justify-between px-2 py-1 rounded text-[10px] bg-card/50 border"
                      >
                        <div className="flex items-center gap-1.5">
                          {build.status === "success" && (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          )}
                          {build.status === "failed" && (
                            <AlertTriangle className="h-3 w-3 text-red-400" />
                          )}
                          {build.status === "running" && (
                            <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                          )}
                          <span className="text-muted-foreground">
                            {new Date(build.startedAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {build.duration !== undefined && (
                            <span className="text-muted-foreground/60 font-mono">
                              {build.duration}s
                            </span>
                          )}
                          <Badge
                            variant="secondary"
                            className={cn(
                              "h-3.5 px-1 text-[8px]",
                              build.status === "success" && "bg-emerald-500/10 text-emerald-400",
                              build.status === "failed" && "bg-red-500/10 text-red-400",
                              build.status === "running" && "bg-amber-500/10 text-amber-400",
                            )}
                          >
                            {build.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Separator />

          {/* ─── Event Timeline ─── */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Timeline
            </span>

            {timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-[11px] text-muted-foreground">
                  No activity yet
                </p>
                <p className="text-[10px] text-muted-foreground/50">
                  Events will appear here during execution
                </p>
              </div>
            ) : (
              <div className="relative space-y-0.5">
                {/* Vertical timeline line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

                {timeline.map((entry, idx) => {
                  const Icon = entry.icon;
                  const colors = colorMap[entry.color];
                  const _dotColor = dotColorMap[entry.color];

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: idx > timeline.length - 5 ? 0.05 : 0 }}
                      className="relative flex items-start gap-2.5 py-1 pl-0"
                    >
                      {/* Dot */}
                      <div
                        className={cn(
                          "relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full shrink-0",
                          colors,
                        )}
                      >
                        <Icon className="h-3 w-3" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-medium truncate">{entry.label}</span>
                          <span className="text-[9px] text-muted-foreground/50 font-mono shrink-0">
                            {formatRelativeTime(entry.timestamp)}
                          </span>
                        </div>
                        {entry.detail && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {entry.detail}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
