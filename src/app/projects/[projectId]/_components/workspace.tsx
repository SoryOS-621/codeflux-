/**
 * @file _components/workspace.tsx
 * @description Master workspace orchestrator — premium 3-column layout.
 *
 * Layout (desktop):
 *   ┌──────────────────────────────────────────────────────┐
 *   │                  WorkspaceHeader                     │
 *   ├──────────────────────────────────────────────────────┤
 *   │                 SandboxStatusBar                     │
 *   ├──────────┬───────────────┬───────────────────────────┤
 *   │ Sidebar  │   ChatPanel   │       RightPanel          │
 *   │ (260px)  │  (resizable)  │  (code/preview/logs/term) │
 *   │          │               │                           │
 *   └──────────┴───────────────┴───────────────────────────┘
 *
 * Mobile: Chat by default, slide-over panels.
 *
 * Preserves: tRPC data fetching, SSE events, keyboard shortcuts,
 * phase toasts, file-map derivation from fragments.
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
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSandboxStore } from "@/stores/sandbox-store";
import { useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { WorkspaceHeader } from "./workspace-header";
import { SandboxStatusBar } from "./sandbox-status-bar";
import { WorkspaceSidebar } from "./sidebar/workspace-sidebar";
import { ChatPanel } from "./chat/chat-panel";
import { RightPanel } from "./panels/right-panel";
import { MobileTabBar, type MobileTab } from "./mobile-tab-bar";
import { WorkspaceSkeleton } from "./workspace-skeleton";

// Mobile panels imported for slide-over
import { MonacoEditorPanel } from "./editor/monaco-editor-panel";
import { LogsPanel } from "./panels/logs-panel";

interface WorkspaceProps {
  projectId: string;
}

export function Workspace({ projectId }: WorkspaceProps) {
  const trpc = useTRPC();
  const isMobile = useIsMobile();

  const { mobilePanel, setMobilePanel } = useWorkspaceStore();

  /** Ref to the chat textarea for Ctrl+K focussing. */
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  /** Global keyboard shortcuts. */
  useKeyboardShortcuts({
    onFocusPrompt: () => {
      if (isMobile) setMobilePanel("chat");
      setTimeout(() => chatInputRef.current?.focus(), 50);
    },
  });

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

  /** Feed build logs into the sandbox store so panels can show them. */
  const addLog = useSandboxStore((s) => s.addLog);
  const prevLogLenRef = useRef(0);
  useEffect(() => {
    const logs = workspaceState.buildLogs;
    for (let i = prevLogLenRef.current; i < logs.length; i++) {
      const log = logs[i];
      addLog({
        level: log.source === "stderr" ? "error" : "info",
        message: log.chunk,
        source: "build",
      });
    }
    prevLogLenRef.current = logs.length;
  }, [workspaceState.buildLogs, addLog]);

  /** Sync build phase to sandbox store. */
  const setBuildStatus = useSandboxStore((s) => s.setBuildStatus);
  useEffect(() => {
    const p = workspaceState.phase;
    if (p === "building") setBuildStatus("building");
    else if (p === "completed") setBuildStatus("success");
    else if (p === "error") setBuildStatus("error");
  }, [workspaceState.phase, setBuildStatus]);

  /** Show toast notifications on agent phase transitions. */
  const prevPhaseRef = useRef(workspaceState.phase);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    const curr = workspaceState.phase;
    if (prev === curr) return;
    prevPhaseRef.current = curr;

    const phaseToasts: Record<string, { msg: string; type?: "success" | "error" | "info" }> = {
      planning:  { msg: "Planning your project..." },
      coding:    { msg: "Generating code..." },
      building:  { msg: "Building the project..." },
      debugging: { msg: "Debugging issues..." },
      verifying: { msg: "Verifying the build..." },
      completed: { msg: "Project completed!", type: "success" },
      error:     { msg: "An error occurred", type: "error" },
    };

    const entry = phaseToasts[curr];
    if (!entry) return;

    if (entry.type === "success") toast.success(entry.msg);
    else if (entry.type === "error") toast.error(entry.msg);
    else toast.info(entry.msg);
  }, [workspaceState.phase]);

  /**
   * Build the complete file map from fragment files (persisted data)
   * plus real-time SSE file write events.
   */
  const fileMap = useMemo(() => {
    const map: Record<string, string> = {};

    if (projectQuery.data?.messages) {
      const assistantMessages = projectQuery.data.messages
        .filter((m) => m.role === "ASSISTANT" && m.fragment);
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

  // ─── Loading state ─────────────────────────────────────────────────
  if (projectQuery.isLoading) {
    return <WorkspaceSkeleton />;
  }

  // ─── Error state ───────────────────────────────────────────────────
  if (projectQuery.error || !projectQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-destructive text-lg">!</span>
          </div>
          <h2 className="text-lg font-semibold">Project not found</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {projectQuery.error?.message ?? "This project doesn't exist or you don't have access."}
          </p>
        </div>
      </div>
    );
  }

  const project = projectQuery.data;

  // Helper: handle file selection from sidebar
  const handleSelectFile = (file: string) => {
    useWorkspaceStore.getState().openTab(file);
    useWorkspaceStore.getState().setRightPanelTab("code");
  };

  // ─── Desktop layout ────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="flex h-full flex-col bg-background">
        {/* Header */}
        <WorkspaceHeader
          project={project}
          latestStatus={agentEvents.latestStatus}
          phase={workspaceState.phase}
        />

        {/* Status bar */}
        <SandboxStatusBar />

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <WorkspaceSidebar
            project={project}
            files={fileMap}
            writtenFiles={workspaceState.writtenFiles}
            phase={workspaceState.phase}
            onSelectFile={handleSelectFile}
          />

          {/* Chat + Right panel with resizable divider */}
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Chat panel */}
            <ResizablePanel defaultSize={30} minSize={22} maxSize={45}>
              <ChatPanel
                projectId={projectId}
                messages={project.messages}
                isGenerating={project.status === "GENERATING"}
                latestStatus={agentEvents.latestStatus}
                chatInputRef={chatInputRef}
              />
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/20 transition-colors data-[resize-handle-active]:bg-primary/30" />

            {/* Right panel — Code / Preview / Logs / Terminal */}
            <ResizablePanel defaultSize={70} minSize={40}>
              <RightPanel
                files={fileMap}
                writtenFiles={workspaceState.writtenFiles}
                previewUrl={previewUrl}
                phase={workspaceState.phase}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    );
  }

  // ─── Mobile layout ─────────────────────────────────────────────────
  const fileCount = Object.keys(fileMap).length;
  const mobileTab: MobileTab =
    mobilePanel === "chat" ? "chat" :
    mobilePanel === "editor" ? "code" : "preview";

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <WorkspaceHeader
        project={project}
        latestStatus={agentEvents.latestStatus}
        phase={workspaceState.phase}
      />

      {/* Main content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Chat is always the base layer */}
        <ChatPanel
          projectId={projectId}
          messages={project.messages}
          isGenerating={project.status === "GENERATING"}
          latestStatus={agentEvents.latestStatus}
          chatInputRef={chatInputRef}
        />

        {/* Slide-over panels */}
        <AnimatePresence>
          {mobilePanel === "editor" && (
            <motion.div
              key="mobile-editor"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-0 bg-background z-20"
            >
              <MonacoEditorPanel files={fileMap} writtenFiles={workspaceState.writtenFiles} />
            </motion.div>
          )}
          {mobilePanel === "logs" && (
            <motion.div
              key="mobile-logs"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-0 bg-background z-20"
            >
              <LogsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile tab bar */}
      <MobileTabBar
        activeTab={mobileTab}
        onTabChange={(tab) => {
          if (tab === "chat") setMobilePanel("chat");
          else if (tab === "code") setMobilePanel("editor");
          else setMobilePanel("chat"); // preview requires different handling
        }}
        fileCount={fileCount}
        hasPreview={!!previewUrl}
        isGenerating={project.status === "GENERATING"}
      />
    </div>
  );
}
