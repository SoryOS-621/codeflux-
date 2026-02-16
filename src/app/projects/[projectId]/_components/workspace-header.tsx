/**
 * @file _components/workspace-header.tsx
 * @description Premium workspace header bar — project name, status, phase,
 * actions, and navigation. Minimal and clean.
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { StatusBadge } from "@/components/shared/status-badge";
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
  ExternalLink,
  Undo2,
  Pause,
  Play,
  History,
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Project } from "@/types";
import type { WorkspacePhase } from "@/hooks/use-workspace-state";

interface WorkspaceHeaderProps {
  project: Project;
  latestStatus: string | null;
  phase: WorkspacePhase;
}

export function WorkspaceHeader({
  project,
  latestStatus,
  phase,
}: WorkspaceHeaderProps) {
  const { executionPaused, toggleExecutionPaused } = useWorkspaceStore();
  const isActive = phase !== "idle" && phase !== "completed" && phase !== "error";

  return (
    <TooltipProvider>
      <header className="flex h-11 items-center justify-between border-b px-3 bg-card/50 shrink-0 select-none">
        {/* Left: Back + Logo + Project Name */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </Link>

          <Separator orientation="vertical" className="h-4" />

          <Logo showText={false} />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold truncate max-w-[180px]">
              {project.name}
            </h1>
            <StatusBadge status={project.status} />
          </div>

          {/* Phase status */}
          {latestStatus && isActive && (
            <>
              <Separator orientation="vertical" className="h-4 hidden lg:block" />
              <div className="hidden lg:flex items-center gap-1.5 max-w-[300px]">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {latestStatus}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5">
          {/* Execution control */}
          {isActive && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
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
              <Separator orientation="vertical" className="h-4 mx-0.5" />
            </>
          )}

          {/* Undo last AI step */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo last AI step</TooltipContent>
          </Tooltip>

          {/* Version history */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <History className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Version history</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          {/* Open preview */}
          {project.sandboxUrl && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" asChild>
              <a
                href={project.sandboxUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Preview</span>
              </a>
            </Button>
          )}

          <ThemeToggle />
        </div>
      </header>
    </TooltipProvider>
  );
}
