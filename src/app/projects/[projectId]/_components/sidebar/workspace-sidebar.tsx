/**
 * @file _components/sidebar/workspace-sidebar.tsx
 * @description Collapsible left sidebar with file tree and enhanced agent pipeline.
 * Token usage and deploy actions moved to SystemBar.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeft,
  Settings,
  Plus,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Logo } from "@/components/shared/logo";
import { FileTreeView } from "./file-tree";
import { AgentStatusPanel } from "./agent-status-panel";
import type { WorkspacePhase } from "@/hooks/use-workspace-state";
import type { Project } from "@/types";

interface WorkspaceSidebarProps {
  project: Project;
  files: Record<string, string>;
  writtenFiles: string[];
  phase: WorkspacePhase;
  onSelectFile: (file: string) => void;
  latestStatus?: string | null;
  currentAgent?: string | null;
}

export function WorkspaceSidebar({
  project,
  files,
  writtenFiles,
  phase,
  onSelectFile,
  latestStatus,
  currentAgent,
}: WorkspaceSidebarProps) {
  const { sidebarOpen, toggleSidebar } = useWorkspaceStore();

  return (
    <TooltipProvider>
      <AnimatePresence mode="wait">
        {sidebarOpen ? (
          <motion.aside
            key="sidebar-open"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex flex-col border-r bg-sidebar h-full overflow-hidden shrink-0"
          >
            {/* Header */}
            <div className="flex h-12 items-center justify-between px-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Logo showText={false} />
                <span className="text-sm font-semibold truncate">
                  {project.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={toggleSidebar}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Scrollable content */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* File Tree */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Files
                    </span>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {Object.keys(files).length > 0 ? (
                    <FileTreeView
                      files={files}
                      writtenFiles={writtenFiles}
                      onSelectFile={onSelectFile}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">
                        No files yet
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Agent Pipeline */}
                <AgentStatusPanel
                  phase={phase}
                  latestStatus={latestStatus}
                  currentAgent={currentAgent}
                />
              </div>
            </ScrollArea>

            {/* Minimal bottom section — settings only */}
            <div className="border-t p-3 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8">
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Workspace Settings</TooltipContent>
              </Tooltip>
            </div>
          </motion.aside>
        ) : (
          <motion.div
            key="sidebar-collapsed"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 48, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex flex-col items-center border-r bg-sidebar py-3 gap-2 shrink-0"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleSidebar}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand Sidebar</TooltipContent>
            </Tooltip>

            <div className="flex-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
