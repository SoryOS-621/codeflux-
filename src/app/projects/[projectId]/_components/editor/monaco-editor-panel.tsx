/**
 * @file _components/editor/monaco-editor-panel.tsx
 * @description Enhanced Monaco code editor with tabbed files, breadcrumb,
 * diff mode toggle (green/red inline diff for AI-edited files),
 * accept/reject change controls, and agent gutter indicator.
 */

"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import {
  X,
  FileCode,
  Circle,
  Code2,
  GitCompareArrows,
  Check,
  XIcon,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

// Lazy-load Monaco & DiffEditor to avoid SSR issues
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading editor...
        </div>
      </div>
    ),
  },
);

const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading diff editor...
        </div>
      </div>
    ),
  },
);

interface MonacoEditorPanelProps {
  files: Record<string, string>;
  writtenFiles: string[];
  /** Original file contents before AI edits — for diff mode */
  previousFiles?: Record<string, string>;
}

function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    toml: "ini",
    py: "python",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    graphql: "graphql",
    prisma: "prisma",
    env: "ini",
  };
  return map[ext] ?? "plaintext";
}

function getFileName(path: string): string {
  return path.split("/").pop() ?? path;
}

export function MonacoEditorPanel({ files, writtenFiles, previousFiles }: MonacoEditorPanelProps) {
  const { activeFile, openTabs, closeTab, setActiveFile } = useWorkspaceStore();
  const [diffMode, setDiffMode] = useState(false);

  const currentContent = activeFile ? files[activeFile] ?? "" : "";
  const originalContent = activeFile ? previousFiles?.[activeFile] ?? "" : "";
  const currentLanguage = activeFile ? getLanguage(activeFile) : "plaintext";
  const isAiEdited = activeFile ? writtenFiles.includes(activeFile) : false;
  const hasDiff = isAiEdited && originalContent !== currentContent && originalContent !== "";

  const handleTabClick = useCallback((file: string) => {
    setActiveFile(file);
  }, [setActiveFile]);

  const handleTabClose = useCallback((e: React.MouseEvent, file: string) => {
    e.stopPropagation();
    closeTab(file);
  }, [closeTab]);

  // If no file is open, show placeholder
  if (!activeFile || openTabs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background text-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Code2 className="h-6 w-6 text-muted-foreground/30" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">No file open</p>
          <p className="text-xs text-muted-foreground/60">
            Select a file from the sidebar to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col bg-background">
        {/* Tab bar */}
        <div className="flex items-center h-9 border-b bg-card/30 shrink-0">
          <ScrollArea className="flex-1">
            <div className="flex items-center h-9">
              {openTabs.map((tab) => {
                const isActive = tab === activeFile;
                const isNew = writtenFiles.includes(tab);
                return (
                  <div
                    key={tab}
                    onClick={() => handleTabClick(tab)}
                    className={cn(
                      "flex items-center gap-1.5 h-full px-3 text-xs border-r border-border/30 transition-colors duration-150 shrink-0 group cursor-pointer",
                      isActive
                        ? "bg-background text-foreground border-b-2 border-b-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                    )}
                  >
                    <FileCode className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[120px]">{getFileName(tab)}</span>
                    {isNew && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Bot className="h-2.5 w-2.5 text-blue-400" />
                            <Circle className="h-1.5 w-1.5 fill-emerald-400 text-emerald-400" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Modified by AI agent</TooltipContent>
                      </Tooltip>
                    )}
                    <button
                      onClick={(e) => handleTabClose(e, tab)}
                      className="ml-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="h-0" />
          </ScrollArea>

          {/* Diff mode toggle + accept/reject */}
          <div className="flex items-center gap-1 px-2 shrink-0 border-l border-border/30">
            {hasDiff && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={diffMode ? "secondary" : "ghost"}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setDiffMode(!diffMode)}
                  >
                    <GitCompareArrows className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{diffMode ? "Exit diff view" : "Show changes"}</TooltipContent>
              </Tooltip>
            )}
            {isAiEdited && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Accept changes</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reject changes</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        {activeFile && (
          <div className="flex items-center gap-1 h-7 px-3 text-[10px] text-muted-foreground bg-card/20 border-b border-border/30 shrink-0">
            {isAiEdited && (
              <Badge variant="secondary" className="text-[8px] h-3.5 px-1 mr-1 bg-blue-500/10 text-blue-400 gap-0.5">
                <Bot className="h-2 w-2" />
                AI
              </Badge>
            )}
            {activeFile.split("/").map((part, idx, arr) => (
              <span key={idx} className="flex items-center gap-1">
                {idx > 0 && <span className="text-muted-foreground/30">/</span>}
                <span className={idx === arr.length - 1 ? "text-foreground" : ""}>
                  {part}
                </span>
              </span>
            ))}
            <Badge variant="secondary" className="ml-auto text-[9px] h-4 px-1.5">
              {currentLanguage}
            </Badge>
            {diffMode && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-amber-500/10 text-amber-400">
                DIFF
              </Badge>
            )}
          </div>
        )}

        {/* Editor / DiffEditor */}
        <div className="flex-1 min-h-0">
          {diffMode && hasDiff ? (
            <MonacoDiffEditor
              height="100%"
              language={currentLanguage}
              original={originalContent}
              modified={currentContent}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineHeight: 20,
                fontFamily: "var(--font-geist-mono), 'Fira Code', 'Cascadia Code', monospace",
                renderSideBySide: false,
                scrollBeyondLastLine: false,
                overviewRulerBorder: false,
                scrollbar: {
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6,
                },
              }}
            />
          ) : (
            <MonacoEditor
              height="100%"
              language={currentLanguage}
              value={currentContent}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineHeight: 20,
                fontFamily: "var(--font-geist-mono), 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                padding: { top: 12, bottom: 12 },
                scrollBeyondLastLine: false,
                renderLineHighlight: "gutter",
                cursorBlinking: "smooth",
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                guides: { indentation: true, bracketPairs: true },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                scrollbar: {
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6,
                  verticalSliderSize: 6,
                },
                glyphMargin: true,
              }}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
