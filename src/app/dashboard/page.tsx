/**
 * @file app/dashboard/page.tsx
 * @description Dashboard page — displays all projects with search/filter/sort.
 *
 * This is a client component since it uses tRPC queries and interactive state.
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
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { ProjectCard } from "./_components/project-card";
import { EmptyDashboard } from "./_components/empty-dashboard";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

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

  // Filter and sort projects
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
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner text="Loading projects..." size="lg" />
      </div>
    );
  }

  if (!projectsQuery.data?.length) {
    return <EmptyDashboard />;
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {projectsQuery.data.length} project{projectsQuery.data.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => router.push("/")} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-md">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects grid/list */}
      {filteredProjects.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          No projects match &quot;{search}&quot;
        </p>
      ) : (
        <div
          className={
            view === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3"
          }
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              view={view}
              onDelete={() => deleteProject.mutate({ projectId: project.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
