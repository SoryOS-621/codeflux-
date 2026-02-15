/**
 * @file _components/progress/agent-progress-bar.tsx
 * @description Horizontal stepper showing the current phase of the AI agent pipeline.
 *
 * Phases: Planning → Coding → Building → Debugging → Verifying → Complete
 * Each step shows a status icon (completed ✓, active spinner, upcoming dot).
 * Can be expanded/collapsed to show build logs.
 */

"use client";

import { useState } from "react";
import type { WorkspacePhase } from "@/hooks/use-workspace-state";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Code2,
  Hammer,
  Bug,
  ShieldCheck,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentProgressBarProps {
  phase: WorkspacePhase;
  buildLogs: Array<{ source: "stdout" | "stderr"; chunk: string }>;
  debugAttempt: number;
}

const STEPS = [
  { key: "planning", label: "Plan", icon: Lightbulb },
  { key: "coding", label: "Code", icon: Code2 },
  { key: "building", label: "Build", icon: Hammer },
  { key: "debugging", label: "Debug", icon: Bug },
  { key: "verifying", label: "Verify", icon: ShieldCheck },
  { key: "completed", label: "Done", icon: PartyPopper },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const PHASE_ORDER: Record<string, number> = {
  idle: -1,
  planning: 0,
  coding: 1,
  building: 2,
  debugging: 3,
  verifying: 4,
  completed: 5,
  error: -2,
};

function getStepStatus(
  stepKey: StepKey,
  currentPhase: WorkspacePhase,
): "completed" | "active" | "upcoming" | "error" {
  const stepIndex = PHASE_ORDER[stepKey] ?? -1;
  const currentIndex = PHASE_ORDER[currentPhase] ?? -1;

  if (currentPhase === "error") {
    // Mark all steps up to where we failed as completed, current as error
    // We don't know exactly which step failed, so highlight last active
    return stepIndex < currentIndex ? "completed" : "upcoming";
  }

  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "active";
  return "upcoming";
}

export function AgentProgressBar({
  phase,
  buildLogs,
  debugAttempt,
}: AgentProgressBarProps) {
  const [logsExpanded, setLogsExpanded] = useState(false);

  // Don't show progress bar in idle state
  if (phase === "idle") return null;

  return (
    <div className="border-t bg-muted/20">
      {/* Step indicators */}
      <div className="flex items-center gap-0 px-4 py-2 overflow-x-auto">
        {STEPS.map((step, i) => {
          const status = getStepStatus(step.key, phase);

          return (
            <div key={step.key} className="flex items-center">
              {/* Connector line (before each step except first) */}
              {i > 0 && (
                <div
                  className={cn(
                    "h-px w-6 sm:w-10 transition-colors",
                    status === "upcoming"
                      ? "bg-muted-foreground/20"
                      : "bg-primary",
                  )}
                />
              )}

              {/* Step node */}
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border transition-all",
                    status === "completed" &&
                      "border-primary bg-primary text-primary-foreground",
                    status === "active" &&
                      "border-primary bg-primary/10 text-primary",
                    status === "upcoming" &&
                      "border-muted-foreground/30 text-muted-foreground/40",
                    status === "error" &&
                      "border-destructive bg-destructive/10 text-destructive",
                  )}
                >
                  {status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : status === "active" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : status === "error" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    status === "completed" && "text-primary",
                    status === "active" && "text-primary",
                    status === "upcoming" && "text-muted-foreground/50",
                    status === "error" && "text-destructive",
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* Debug attempt badge */}
        {phase === "debugging" && debugAttempt > 0 && (
          <span className="ml-3 text-xs text-amber-500 font-medium">
            Attempt {debugAttempt}
          </span>
        )}

        {/* Error state */}
        {phase === "error" && (
          <span className="ml-3 text-xs text-destructive font-medium">
            Failed
          </span>
        )}

        {/* Completed state */}
        {phase === "completed" && (
          <span className="ml-3 text-xs text-emerald-500 font-medium">
            Complete!
          </span>
        )}

        {/* Logs toggle */}
        {buildLogs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 gap-1 text-xs text-muted-foreground"
            onClick={() => setLogsExpanded(!logsExpanded)}
          >
            Logs ({buildLogs.length})
            {logsExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      {/* Expandable build logs */}
      {logsExpanded && buildLogs.length > 0 && (
        <div className="border-t">
          <ScrollArea className="max-h-[150px]">
            <div className="p-3 font-mono text-[11px] leading-relaxed text-muted-foreground space-y-0.5">
              {buildLogs.map((log, i) => (
                <div key={i} className={cn(
                  "whitespace-pre-wrap break-all",
                  log.source === "stderr" && "text-red-400",
                )}>
                  <span className="text-muted-foreground/50 select-none mr-2">
                    {String(i + 1).padStart(3, " ")}
                  </span>
                  {log.chunk}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
