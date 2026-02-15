/**
 * @file _components/preview/preview-loading.tsx
 * @description Loading / placeholder state for the preview panel
 * before a sandbox URL is available.
 */

"use client";

import type { WorkspacePhase } from "@/hooks/use-workspace-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Globe, Loader2, AlertTriangle } from "lucide-react";

interface PreviewLoadingProps {
  phase: WorkspacePhase;
}

export function PreviewLoading({ phase }: PreviewLoadingProps) {
  const content = getContent(phase);

  return (
    <div className="flex h-full flex-col">
      {/* Header to match toolbar height */}
      <div className="flex items-center border-b px-3 py-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Preview
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <EmptyState
          icon={content.icon}
          title={content.title}
          description={content.description}
        />
      </div>
    </div>
  );
}

function getContent(phase: WorkspacePhase) {
  switch (phase) {
    case "planning":
    case "coding":
      return {
        icon: Loader2,
        title: "Building your app...",
        description:
          "The live preview will appear here once the sandbox is ready.",
      };
    case "building":
    case "debugging":
    case "verifying":
      return {
        icon: Loader2,
        title: "Starting preview server...",
        description:
          "Compiling and running your application in a cloud sandbox.",
      };
    case "error":
      return {
        icon: AlertTriangle,
        title: "Preview unavailable",
        description:
          "An error occurred during build. Check the chat for details.",
      };
    case "completed":
      return {
        icon: Globe,
        title: "Preview loading...",
        description: "The sandbox URL should appear shortly.",
      };
    default:
      return {
        icon: Globe,
        title: "No preview yet",
        description:
          "Send a message to generate your project and see a live preview.",
      };
  }
}
