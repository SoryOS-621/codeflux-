/**
 * @file app/dashboard/page.tsx
 * @description Premium dashboard — all projects with search, filter, sort, and stats.
 */

"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, LayoutGrid, List, Folder, Zap, Clock } from "lucide-react";
import { ProjectCard } from "./_components/project-card";
import { EmptyDashboard } from "./_components/empty-dashboard";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "oldest" | "name";
type ViewMode = "grid" | "list";

const DashboardPage = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [view, setView] = useState<ViewMode>("grid");

  const projectsQuery = useQuery(trpc.projects.getMany.queryOptions());

  const deleteProject = useMutation(
    trpc.projects.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.projects.getMany.queryKey() });
      },
    }),
  );

  const filteredProjects = (projectsQuery.data ?? [])
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "oldest":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  if (projectsQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (!projectsQuery.data?.length) {
    return <EmptyDashboard />;
  }

  const totalProjects = projectsQuery.data.length;
  const activeProjects = projectsQuery.data.filter((p) => p.status === "GENERATING").length;

  return (
    <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
      {/* Page title + stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Folder className="h-3 w-3" />
              {totalProjects} project{totalProjects !== 1 ? "s" : ""}
            </span>
            {activeProjects > 0 && (
              <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                <Zap className="h-2.5 w-2.5 text-primary" />
                {activeProjects} active
              </Badge>
            )}
          </div>
        </div>
        <Button onClick={() => router.push("/")} className="gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </motion.div>

      {/* Search + filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9 h-9 text-sm bg-card/50 border-border/60"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-card/50 border-border/60">
              <Clock className="h-3 w-3 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-md border-border/60 overflow-hidden">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setView("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Projects */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">
            No projects match &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className={cn(
            view === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3",
          )}
        >
          {filteredProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * Math.min(idx, 8), duration: 0.3 }}
            >
              <ProjectCard
                project={project}
                view={view}
                onDelete={() => deleteProject.mutate({ projectId: project.id })}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
