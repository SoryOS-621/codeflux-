/**
 * @file app/dashboard/_components/project-card.tsx
 * @description Card representing a single project in the dashboard.
 *
 * Supports grid and list view modes. Shows project name, status badge,
 * relative timestamp, and a dropdown menu for actions.
 */

"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import {
  MoreHorizontal,
  ExternalLink,
  Trash2,
  FolderOpen,
} from "lucide-react";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  view: "grid" | "list";
  onDelete: () => void;
}

export function ProjectCard({ project, view, onDelete }: ProjectCardProps) {
  if (view === "list") {
    return (
      <Link href={`/projects/${project.id}`}>
        <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{project.name}</p>
                <RelativeTime date={project.updatedAt} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={project.status} />
              <ProjectActions
                project={project}
                onDelete={onDelete}
              />
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Grid view
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-foreground/20 hover:shadow-md transition-all cursor-pointer h-full">
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <ProjectActions project={project} onDelete={onDelete} />
          </div>
          <CardTitle className="text-base mt-2">{project.name}</CardTitle>
          <CardDescription className="flex items-center justify-between">
            <StatusBadge status={project.status} />
            <RelativeTime date={project.updatedAt} />
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function ProjectActions({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
        <DropdownMenuItem asChild>
          <Link href={`/projects/${project.id}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open
          </Link>
        </DropdownMenuItem>
        {project.sandboxUrl && (
          <DropdownMenuItem asChild>
            <a href={project.sandboxUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
