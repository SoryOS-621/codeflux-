/**
 * @file page.tsx  (Home page — route: `/`)
 * @description The landing page where users type a prompt to start a new project,
 * or pick a preconfigured template for faster builds.
 *
 * ## User flow
 * 1. User types a description of what they want to build
 * 2. Optionally selects a template card for faster generation
 * 3. Clicks "Start Creating"
 * 4. A new project is created via `trpc.projects.create`
 * 5. The user is redirected to `/projects/[projectId]` to watch the AI work
 */

"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { StatusBadge } from "@/components/shared/status-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Code2,
  Eye,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const HomePage = () => {
  const router = useRouter();
  const trpc = useTRPC();

  /** The text the user types into the prompt input field. */
  const [promptText, setPromptText] = useState("");

  /** The currently selected template ID (null = freeform). */
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  /** Fetch available templates. */
  const templatesQuery = useQuery(trpc.templates.getAll.queryOptions());

  /** Fetch recent projects for the recent bar. */
  const projectsQuery = useQuery(trpc.projects.getMany.queryOptions());

  /** Mutation to create a new project from the user's prompt. */
  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: (data) => {
        router.push(`/projects/${data.id}`);
      },
    }),
  );

  const handleCreateProject = () => {
    const prompt =
      promptText ||
      (selectedTemplate
        ? `Build a ${templatesQuery.data?.find((t) => t.id === selectedTemplate)?.name ?? "website"}`
        : "");

    if (!prompt) {
      toast.error("Please enter a description or select a template.");
      return;
    }

    createProject.mutate({
      prompt,
      ...(selectedTemplate ? { templateId: selectedTemplate } : {}),
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null);
    } else {
      setSelectedTemplate(templateId);
      const template = templatesQuery.data?.find((t) => t.id === templateId);
      if (template && !promptText) {
        setPromptText(`Build a ${template.name.toLowerCase()}`);
      }
    }
  };

  const recentProjects = projectsQuery.data?.slice(0, 4) ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Logo showText />
        <div className="flex items-center gap-2">
          {recentProjects.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Dashboard
              </Link>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full mx-auto flex flex-col items-center gap-y-10">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">
                AI-Powered Code Generation
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              What do you want to{" "}
              <span className="text-primary">build</span>?
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Describe your project and watch AI generate a fully working
              application in real-time with live preview.
            </p>
          </div>

          {/* Prompt input area */}
          <div className="w-full space-y-3">
            <div className="relative">
              <Textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Describe what you want to build... e.g., 'A todo app with dark mode and local storage'"
                className="min-h-[100px] resize-none pr-4 text-base"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !createProject.isPending
                  ) {
                    e.preventDefault();
                    handleCreateProject();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Press Enter to submit, Shift+Enter for new line
              </span>
              <Button
                disabled={createProject.isPending}
                onClick={handleCreateProject}
                size="lg"
                className="gap-2"
              >
                {createProject.isPending ? (
                  "Creating..."
                ) : (
                  <>
                    Start Building
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Template section */}
          {templatesQuery.data && templatesQuery.data.length > 0 && (
            <div className="w-full space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm text-muted-foreground px-2 shrink-0">
                  or start from a template
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {templatesQuery.data.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md group",
                      selectedTemplate === template.id
                        ? "ring-2 ring-primary border-primary"
                        : "hover:border-foreground/20",
                    )}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{template.icon}</span>
                        {selectedTemplate === template.id ? (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        ) : (
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent projects bar */}
          {recentProjects.length > 0 && (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Projects
                </h2>
                <Button variant="link" size="sm" className="text-xs" asChild>
                  <Link href="/dashboard">View all</Link>
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <RelativeTime date={project.updatedAt} />
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Feature highlights */}
          <div className="w-full grid gap-4 sm:grid-cols-3 pt-4 border-t">
            <div className="flex items-start gap-3 p-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">AI-Powered</p>
                <p className="text-xs text-muted-foreground">
                  Multi-agent system plans, codes, builds, and debugs
                  automatically
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Code2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Real-time Code</p>
                <p className="text-xs text-muted-foreground">
                  Watch code being generated live with syntax highlighting
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Live Preview</p>
                <p className="text-xs text-muted-foreground">
                  See your app running in a cloud sandbox as it&apos;s being
                  built
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Built with Next.js, TypeScript, and AI
        </p>
      </footer>
    </div>
  );
};

export default HomePage;