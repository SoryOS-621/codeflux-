"use client";

import { useState, useMemo } from "react";
import { Code2, FileX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileTree } from "./file-tree";
import { CodeViewer } from "./code-viewer";

interface CodePanelProps {
  files: Record<string, string>;
}

export function CodePanel({ files }: CodePanelProps) {
  const fileKeys = useMemo(() => Object.keys(files), [files]);
  const [selectedFile, setSelectedFile] = useState<string | null>(
    fileKeys.length > 0 ? fileKeys[0] : null
  );

  const selectedContent = selectedFile ? files[selectedFile] ?? null : null;
  const hasFiles = fileKeys.length > 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-10 border-b border-border flex items-center px-4 shrink-0">
        <Code2 className="size-3.5 text-muted-foreground mr-2" />
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Code
        </h3>
        {hasFiles && (
          <span className="ml-auto text-[10px] text-muted-foreground/50">
            {fileKeys.length} file{fileKeys.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {hasFiles ? (
        <div className="flex flex-1 min-h-0">
          {/* File tree sidebar */}
          <div className="w-52 border-r border-border shrink-0">
            <ScrollArea className="h-full">
              <FileTree
                files={files}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
              />
            </ScrollArea>
          </div>

          {/* Code viewer */}
          <div className="flex-1 min-w-0">
            {selectedFile && selectedContent !== null ? (
              <CodeViewer code={selectedContent} filePath={selectedFile} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Select a file to view
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
          <div className="size-14 rounded-xl bg-accent/50 border border-border flex items-center justify-center">
            <FileX className="size-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm">No files generated yet</p>
        </div>
      )}
    </div>
  );
}
