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
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const HomePage = () => {
  const router = useRouter();
  const trpc = useTRPC();

  /** The text the user types into the prompt input field. */
  const [promptText, setPromptText] = useState("");

  /** The currently selected template ID (null = freeform). */
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  /** Fetch available templates. */
  const templatesQuery = useQuery(trpc.templates.getAll.queryOptions());

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
    const prompt = promptText || (selectedTemplate
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
      setSelectedTemplate(null); // Deselect
    } else {
      setSelectedTemplate(templateId);
      // Pre-fill prompt if empty
      const template = templatesQuery.data?.find((t) => t.id === templateId);
      if (template && !promptText) {
        setPromptText(`Build a ${template.name.toLowerCase()}`);
      }
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full mx-auto flex items-center flex-col gap-y-8 justify-center">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What do you want to build?
          </h1>
          <p className="text-muted-foreground">
            Describe your project or pick a template to get started faster
          </p>
        </div>

        {/* Prompt input + button */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3">
          <Input
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe what you want to build..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !createProject.isPending) {
                handleCreateProject();
              }
            }}
          />
          <Button
            disabled={createProject.isPending}
            onClick={handleCreateProject}
            size="lg"
          >
            {createProject.isPending ? "Creating..." : "Start Creating"}
          </Button>
        </div>

        {/* Template section */}
        {templatesQuery.data && templatesQuery.data.length > 0 && (
          <div className="w-full space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground px-2">
                or start from a template
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templatesQuery.data.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-foreground/20"
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{template.icon}</span>
                      {selectedTemplate === template.id && (
                        <Badge variant="default" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;