/**
 * @file _components/panels/right-panel.tsx
 * @description Right panel with tabbed interface — Code editor, Live Preview,
 * Logs, and Terminal. Clean, resizable, with smooth tab transitions.
 */

"use client";

import { motion } from "framer-motion";
import {
  Code2,
  Eye,
  ScrollText,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore, type RightPanelTab } from "@/stores/workspace-store";
import { useSandboxStore } from "@/stores/sandbox-store";
import { MonacoEditorPanel } from "../editor/monaco-editor-panel";
import { PreviewPanel } from "../preview/preview-panel";
import { LogsPanel } from "./logs-panel";
import { TerminalPanel } from "./terminal-panel";
import type { WorkspacePhase } from "@/hooks/use-workspace-state";

interface RightPanelProps {
  files: Record<string, string>;
  writtenFiles: string[];
  previewUrl: string | null;
  phase: WorkspacePhase;
}

const tabs: { id: RightPanelTab; icon: React.ElementType; label: string }[] = [
  { id: "code", icon: Code2, label: "Code" },
  { id: "preview", icon: Eye, label: "Preview" },
  { id: "logs", icon: ScrollText, label: "Logs" },
  { id: "terminal", icon: Terminal, label: "Terminal" },
];

export function RightPanel({ files, writtenFiles, previewUrl, phase }: RightPanelProps) {
  const { rightPanelTab, setRightPanelTab } = useWorkspaceStore();
  const errorCount = useSandboxStore((s) => s.logs.filter((l) => l.level === "error").length);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab bar */}
      <div className="flex items-center h-9 border-b px-1 shrink-0 gap-0.5">
        {tabs.map((tab) => {
          const isActive = rightPanelTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setRightPanelTab(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{tab.label}</span>

              {/* Error badge on logs tab */}
              {tab.id === "logs" && errorCount > 0 && (
                <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-1 text-[8px] font-bold text-destructive-foreground">
                  {errorCount}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="rightPanelActiveTab"
                  className="absolute inset-0 bg-muted rounded-md -z-10"
                  transition={{ duration: 0.15, ease: "easeOut" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div className="flex-1 min-h-0">
        {rightPanelTab === "code" && (
          <MonacoEditorPanel files={files} writtenFiles={writtenFiles} />
        )}
        {rightPanelTab === "preview" && (
          <PreviewPanel previewUrl={previewUrl} phase={phase} />
        )}
        {rightPanelTab === "logs" && (
          <LogsPanel />
        )}
        {rightPanelTab === "terminal" && (
          <TerminalPanel />
        )}
      </div>
    </div>
  );
}
