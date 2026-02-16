/**
 * @file _components/workspace.tsx
 * @description Master workspace orchestrator — 5-panel command center layout.
 *
 * Layout (desktop):
 *   ┌──────────────────────────────────────────────────────┐
 *   │                    SystemBar (56px)                   │
 *   ├──────────┬───────────────┬──────────────┬────────────┤
 *   │ Sidebar  │  Execution    │   Code +     │  Activity  │
 *   │ (260px)  │  Intelligence │   Preview    │   Panel    │
 *   │          │   (30%)       │  Logs/Term   │   (20%)    │
 *   │          │               │   (50%)      │            │
 *   └──────────┴───────────────┴──────────────┴────────────┘
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
import { useMemo, useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { SystemBar } from "./system-bar";
import { WorkspaceSidebar } from "./sidebar/workspace-sidebar";
import { ChatPanel } from "./chat/chat-panel";
import { RightPanel } from "./panels/right-panel";
import { ActivityPanel } from "./panels/activity-panel";
import { DeployPanel } from "./panels/deploy-panel";
import { TokenModal } from "./panels/token-modal";
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

  // Deploy/Token modal state
  const [deployOpen, setDeployOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

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
  const addTerminalLine = useSandboxStore((s) => s.addTerminalLine);
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

  /** Feed terminal commands into the terminal panel. */
  const prevCmdLenRef = useRef(0);
  useEffect(() => {
    const cmds = workspaceState.terminalCommands;
    for (let i = prevCmdLenRef.current; i < cmds.length; i++) {
      const cmd = cmds[i];
      addTerminalLine(`$ ${cmd.command}`);
    }
    prevCmdLenRef.current = cmds.length;
  }, [workspaceState.terminalCommands, addTerminalLine]);

  /** Feed log_stream output into terminal lines too (so user sees output). */
  const prevTermLogRef = useRef(0);
  useEffect(() => {
    const logs = workspaceState.buildLogs;
    for (let i = prevTermLogRef.current; i < logs.length; i++) {
      const lines = logs[i].chunk.split("\n").filter(Boolean);
      for (const line of lines) {
        addTerminalLine(line);
      }
    }
    prevTermLogRef.current = logs.length;
  }, [workspaceState.buildLogs, addTerminalLine]);

  /** Sync sandbox ID. */
  const setSandboxId = useSandboxStore((s) => s.setSandboxId);
  useEffect(() => {
    if (projectQuery.data?.sandboxId) {
      setSandboxId(projectQuery.data.sandboxId);
    }
  }, [projectQuery.data?.sandboxId, setSandboxId]);

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
   * Build the complete file map from:
   * 1. Fragment files (persisted data from previous runs)
   * 2. Real-time SSE file_content events (current run)
   * This ensures the editor shows files AS they're written.
   */
  const fileMap = useMemo(() => {
    const map: Record<string, string> = {};

    // Base: persisted fragment from completed run
    if (projectQuery.data?.messages) {
      const assistantMessages = projectQuery.data.messages
        .filter((m) => m.role === "ASSISTANT" && m.fragment);
      const latestFragment = assistantMessages[assistantMessages.length - 1]?.fragment;
      if (latestFragment?.files) {
        Object.assign(map, latestFragment.files);
      }
    }

    // Overlay: real-time file contents from SSE (current run)
    if (workspaceState.fileContents) {
      Object.assign(map, workspaceState.fileContents);
    }

    return map;
  }, [projectQuery.data?.messages, workspaceState.fileContents]);

  /** Determine the preview URL — from early SSE event, completed event, or project data. */
  const previewUrl =
    workspaceState.previewUrl ??
    projectQuery.data?.sandboxUrl ??
    null;

  /**
   * Auto-open files in the editor as they're written.
   * Opens the first written file if no tab is open yet.
   */
  const openTab = useWorkspaceStore((s) => s.openTab);
  const activeFile = useWorkspaceStore((s) => s.activeFile);
  const setRightPanelTab = useWorkspaceStore((s) => s.setRightPanelTab);
  const prevWrittenRef = useRef(0);
  useEffect(() => {
    const written = workspaceState.writtenFiles;
    if (written.length > prevWrittenRef.current) {
      for (let i = prevWrittenRef.current; i < written.length; i++) {
        const file = written[i];
        if (!activeFile || file.endsWith("page.tsx") || file.endsWith("layout.tsx")) {
          openTab(file);
          setRightPanelTab("code");
        }
      }
      prevWrittenRef.current = written.length;
    }
  }, [workspaceState.writtenFiles, openTab, activeFile, setRightPanelTab]);

  /**
   * Auto-switch to preview tab when preview URL becomes available.
   */
  const previewUrlSwitchedRef = useRef(false);
  useEffect(() => {
    if (previewUrl && !previewUrlSwitchedRef.current && workspaceState.phase !== "completed") {
      previewUrlSwitchedRef.current = true;
    }
  }, [previewUrl, workspaceState.phase]);

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
  const buildStatus = useSandboxStore.getState().buildStatus as "idle" | "building" | "success" | "failed";

  // Helper: handle file selection from sidebar
  const handleSelectFile = (file: string) => {
    useWorkspaceStore.getState().openTab(file);
    useWorkspaceStore.getState().setRightPanelTab("code");
  };

  // ─── Desktop layout ────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="flex h-full flex-col bg-background">
        {/* System Bar — replaces WorkspaceHeader + SandboxStatusBar */}
        <SystemBar
          project={project}
          phase={workspaceState.phase}
          latestStatus={agentEvents.latestStatus}
          currentAgent={workspaceState.currentAgent}
          onOpenDeploy={() => setDeployOpen(true)}
          onOpenTokenModal={() => setTokenModalOpen(true)}
        />

        {/* Main content — Sidebar + 3-panel resizable */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <WorkspaceSidebar
            project={project}
            files={fileMap}
            writtenFiles={workspaceState.writtenFiles}
            phase={workspaceState.phase}
            onSelectFile={handleSelectFile}
            latestStatus={agentEvents.latestStatus}
            currentAgent={workspaceState.currentAgent}
          />

          {/* Execution Intelligence + Code/Preview + Activity — resizable 3-way split */}
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Execution Intelligence Panel (formerly Chat) — 30% */}
            <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
              <ChatPanel
                projectId={projectId}
                messages={project.messages}
                isGenerating={project.status === "GENERATING"}
                latestStatus={agentEvents.latestStatus}
                chatInputRef={chatInputRef}
                phase={workspaceState.phase}
              />
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/20 transition-colors data-[resize-handle-active]:bg-primary/30" />

            {/* Code / Preview / Logs / Terminal — 52% */}
            <ResizablePanel defaultSize={52} minSize={35}>
              <RightPanel
                files={fileMap}
                writtenFiles={workspaceState.writtenFiles}
                previewUrl={previewUrl}
                phase={workspaceState.phase}
              />
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/20 transition-colors data-[resize-handle-active]:bg-primary/30" />

            {/* Activity Panel — 20% */}
            <ResizablePanel defaultSize={20} minSize={14} maxSize={30}>
              <ActivityPanel
                events={agentEvents.events}
                phase={workspaceState.phase}
                currentAgent={workspaceState.currentAgent}
                latestStatus={agentEvents.latestStatus}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Overlays */}
        <DeployPanel
          open={deployOpen}
          onClose={() => setDeployOpen(false)}
          buildStatus={buildStatus}
          previewUrl={previewUrl}
        />
        <TokenModal
          open={tokenModalOpen}
          onClose={() => setTokenModalOpen(false)}
          messageCount={project.messages.length}
          fileCount={Object.keys(fileMap).length}
        />
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
      {/* System Bar */}
      <SystemBar
        project={project}
        phase={workspaceState.phase}
        latestStatus={agentEvents.latestStatus}
        currentAgent={workspaceState.currentAgent}
        onOpenDeploy={() => setDeployOpen(true)}
        onOpenTokenModal={() => setTokenModalOpen(true)}
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
          phase={workspaceState.phase}
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
          else setMobilePanel("chat");
        }}
        fileCount={fileCount}
        hasPreview={!!previewUrl}
        isGenerating={project.status === "GENERATING"}
      />

      {/* Overlays */}
      <DeployPanel
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        buildStatus={buildStatus}
        previewUrl={previewUrl}
      />
      <TokenModal
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        messageCount={project.messages.length}
        fileCount={fileCount}
      />
    </div>
  );
}
