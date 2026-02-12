"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectWithCount } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectWithCount;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <Card className="h-full transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors truncate">
              {project.name}
            </CardTitle>
            <Badge variant="secondary" className="shrink-0 text-xs">
              <MessageSquare className="size-3 mr-1" />
              {project._count.messages}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="flex items-center gap-1.5 text-xs">
            <Clock className="size-3" />
            {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

/** Skeleton placeholder for loading state */
export function ProjectCardSkeleton() {
  return (
    <Card className="h-full bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="h-5 w-12 rounded-full bg-muted animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-3 w-20 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}
