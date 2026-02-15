/**
 * @file _components/workspace.tsx
 * @description Master workspace component that orchestrates all panels.
 *
 * Uses react-resizable-panels for a three-panel layout:
 * - Left: Chat panel (messages + input)
 * - Center: Code viewer (file explorer + syntax-highlighted code)
 * - Right: Live preview (iframe + controls)
 *
 * Connects to SSE via useAgentEvents and derives workspace state
 * via useWorkspaceState.
 */

"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useAgentEvents } from "@/hooks/use-agent-events";
import { useWorkspaceState } from "@/hooks/use-workspace-state";
import { useState, useMemo } from "react";

import { WorkspaceHeader } from "./workspace-header";
import { ChatPanel } from "./chat/chat-panel";
import { CodePanel } from "./code/code-panel";
import { PreviewPanel } from "./preview/preview-panel";
import { AgentProgressBar } from "./progress/agent-progress-bar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface WorkspaceProps {
  projectId: string;
}

export function Workspace({ projectId }: WorkspaceProps) {
  const trpc = useTRPC();

  /** Currently selected file path in the code viewer. */
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  /** Fetch project with all messages and fragments. */
  const projectQuery = useQuery(
    trpc.projects.getOne.queryOptions({ projectId }),
  );

  /** Connect to real-time SSE events. */
  const agentEvents = useAgentEvents(projectId, {
    enabled: projectQuery.data?.status === "GENERATING",
  });

  /** Derive structured workspace state from SSE events. */
  const workspaceState = useWorkspaceState(agentEvents.events);

  /**
   * Build the complete file map from:
   * 1. Fragment files from the latest ASSISTANT message (persisted data)
   * 2. files_written SSE events (real-time updates during generation)
   */
  const fileMap = useMemo(() => {
    const map: Record<string, string> = {};

    // Load files from the latest fragment (persisted after previous runs)
    if (projectQuery.data?.messages) {
      const assistantMessages = projectQuery.data.messages
        .filter((m) => m.role === "ASSISTANT" && m.fragment);
      // Use the most recent fragment's files
      const latestFragment = assistantMessages[assistantMessages.length - 1]?.fragment;
      if (latestFragment?.files) {
        Object.assign(map, latestFragment.files);
      }
    }

    return map;
  }, [projectQuery.data?.messages]);

  /** Determine the preview URL — from completed event or project data. */
  const previewUrl =
    workspaceState.previewUrl ??
    projectQuery.data?.sandboxUrl ??
    null;

  // Loading state
  if (projectQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner text="Loading project..." size="lg" />
      </div>
    );
  }

  // Error state
  if (projectQuery.error || !projectQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Project not found</h2>
          <p className="text-sm text-muted-foreground">
            {projectQuery.error?.message ?? "This project doesn't exist."}
          </p>
        </div>
      </div>
    );
  }

  const project = projectQuery.data;

  return (
    <div className="flex h-full flex-col">
      {/* Workspace header */}
      <WorkspaceHeader
        project={project}
        latestStatus={agentEvents.latestStatus}
        phase={workspaceState.phase}
      />

      {/* Three-panel layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left panel: Chat */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <ChatPanel
            projectId={projectId}
            messages={project.messages}
            isGenerating={project.status === "GENERATING"}
            latestStatus={agentEvents.latestStatus}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center panel: Code viewer */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <CodePanel
            files={fileMap}
            writtenFiles={workspaceState.writtenFiles}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            phase={workspaceState.phase}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel: Live preview */}
        <ResizablePanel defaultSize={35} minSize={20}>
          <PreviewPanel
            previewUrl={previewUrl}
            phase={workspaceState.phase}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Bottom progress bar */}
      <AgentProgressBar
        phase={workspaceState.phase}
        debugAttempt={workspaceState.debugAttempt}
        buildLogs={workspaceState.buildLogs}
      />
    </div>
  );
}
