/**
 * @file page.tsx  (Home page — route: `/`)
 * @description The landing page where users type a prompt to start a new project.
 *
 * ## User flow
 * 1. User types a description of what they want to build
 * 2. Clicks "Start Creating"
 * 3. A new project is created via `trpc.projects.create`
 * 4. The user is redirected to `/projects/[projectId]` to watch the AI work
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const HomePage = () => {
  const router = useRouter();
  const trpc = useTRPC();

  /** The text the user types into the prompt input field. */
  const [promptText, setPromptText] = useState("");

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

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto flex items-center flex-col gap-y-4 justify-center">
        <Input
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Describe what you want to build..."
        />
        <Button
          disabled={createProject.isPending}
          onClick={() => createProject.mutate({ prompt: promptText })}
        >
          Start Creating
        </Button>
      </div>
    </div>
  );
};

export default HomePage;