"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Zap, ArrowRight, Sparkles, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { ProjectCard, ProjectCardSkeleton } from "@/components/project-card";
import { useTRPC } from "@/trpc/client";
import { APP_NAME, MAX_PROMPT_LENGTH } from "@/lib/constants";

const PLACEHOLDER_PROMPTS = [
  "Build a Kanban board with drag-and-drop...",
  "Create a weather dashboard with charts...",
  "Design a landing page for a SaaS product...",
  "Make a real-time chat interface...",
];

export default function HomePage() {
  const router = useRouter();
  const trpc = useTRPC();
  const [prompt, setPrompt] = useState("");
  const [placeholderIndex] = useState(() =>
    Math.floor(Math.random() * PLACEHOLDER_PROMPTS.length)
  );

  const projectsQuery = useQuery(trpc.projects.getMany.queryOptions());

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: (data) => {
        router.push(`/projects/${data.id}`);
      },
    })
  );

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("Please describe what you want to build.");
      return;
    }
    createProject.mutate({ value: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 overflow-y-auto">
        {/* Hero section */}
        <section className="flex flex-col items-center justify-center px-4 pt-20 pb-16">
          {/* Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-6">
            <Sparkles className="size-3.5" />
            AI-Powered Code Generation
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center tracking-tight max-w-3xl mb-4">
            Describe it.{" "}
            <span className="text-primary">We build it.</span>
          </h1>

          <p className="text-muted-foreground text-center max-w-lg mb-10 text-base sm:text-lg">
            {APP_NAME} turns your ideas into working applications. Just describe what you want and watch it come to life.
          </p>

          {/* Prompt input */}
          <div className="w-full max-w-2xl relative">
            <div className="rounded-xl border border-border bg-card shadow-lg shadow-black/20 focus-within:border-primary/40 focus-within:shadow-primary/10 transition-all duration-200">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={PLACEHOLDER_PROMPTS[placeholderIndex]}
                maxLength={MAX_PROMPT_LENGTH}
                rows={4}
                disabled={createProject.isPending}
                className="w-full resize-none bg-transparent px-4 pt-4 pb-14 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground/50">
                  {prompt.length}/{MAX_PROMPT_LENGTH}
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={createProject.isPending || !prompt.trim()}
                  size="sm"
                  className="gap-1.5"
                >
                  {createProject.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Start Building
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Recent projects */}
        <section className="px-4 pb-16 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="size-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">Recent Projects</h2>
          </div>

          {projectsQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : projectsQuery.data && projectsQuery.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projectsQuery.data.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
              No projects yet. Describe something above to get started.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}