/**
 * @file _components/workspace-header.tsx
 * @description Header bar displayed at the top of the project workspace.
 *
 * Shows: back button, project name, status badge, phase indicator, and actions.
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
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
  return (
    <header className="flex h-12 items-center justify-between border-b px-3 bg-background shrink-0">
      {/* Left: Back + Logo + Project Name */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Logo showText={false} />
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold truncate max-w-[200px]">
            {project.name}
          </h1>
          <StatusBadge status={project.status} />
        </div>

        {/* Status message */}
        {latestStatus && phase !== "idle" && phase !== "completed" && (
          <span className="text-xs text-muted-foreground truncate max-w-[300px] hidden lg:block">
            {latestStatus}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {project.sandboxUrl && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" asChild>
            <a
              href={project.sandboxUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open Preview</span>
            </a>
          </Button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
