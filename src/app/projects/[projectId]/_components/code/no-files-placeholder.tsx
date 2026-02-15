/**
 * @file _components/code/no-files-placeholder.tsx
 * @description Placeholder shown when no generated files exist yet.
 *
 * Shows a phased message based on the current workspace state.
 */

"use client";

import type { WorkspacePhase } from "@/hooks/use-workspace-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Code2, Loader2, FileCode } from "lucide-react";

interface NoFilesPlaceholderProps {
  phase: WorkspacePhase;
}

export function NoFilesPlaceholder({ phase }: NoFilesPlaceholderProps) {
  const content = getPhaseContent(phase);

  return (
    <div className="flex h-full items-center justify-center p-8">
      <EmptyState
        icon={content.icon}
        title={content.title}
        description={content.description}
      />
    </div>
  );
}

function getPhaseContent(phase: WorkspacePhase) {
  switch (phase) {
    case "planning":
      return {
        icon: Loader2,
        title: "Planning your project...",
        description:
          "The AI is analyzing your request and designing the architecture.",
      };
    case "coding":
      return {
        icon: FileCode,
        title: "Generating code...",
        description:
          "Files will appear here as the AI writes them.",
      };
    case "building":
    case "debugging":
    case "verifying":
      return {
        icon: Loader2,
        title: "Processing...",
        description:
          "The AI is building and verifying the generated code.",
      };
    case "error":
      return {
        icon: Code2,
        title: "Something went wrong",
        description:
          "An error occurred during generation. Check the chat for details.",
      };
    default:
      return {
        icon: Code2,
        title: "No files yet",
        description:
          "Send a message to start generating your project. Files will appear here.",
      };
  }
}
