/**
 * @file _components/code/file-explorer.tsx
 * @description Tree view of generated files with icons and status indicators.
 *
 * Displays files in a flat list grouped by directory.
 * Recently written files (from SSE) are highlighted with a green dot.
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  FileCode,
  FileJson,
  FileText,
  Palette,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileExplorerProps {
  filePaths: string[];
  writtenFiles: string[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

/** Map file extensions to icons. */
function getFileIcon(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return FileCode;
    case "json":
      return FileJson;
    case "css":
    case "scss":
      return Palette;
    default:
      return FileText;
  }
}

/** Build a nested tree structure from flat file paths. */
interface TreeNode {
  name: string;
  fullPath: string;
  isDirectory: boolean;
  children: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const path of paths) {
    const parts = path.split("/");
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");

      let existing = currentLevel.find((n) => n.name === part);
      if (!existing) {
        existing = {
          name: part,
          fullPath,
          isDirectory: !isFile,
          children: [],
        };
        currentLevel.push(existing);
      }
      currentLevel = existing.children;
    }
  }

  // Sort: folders first, then files, alphabetically
  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((n) => ({ ...n, children: sortNodes(n.children) }));
  }

  return sortNodes(root);
}

export function FileExplorer({
  filePaths,
  writtenFiles,
  selectedFile,
  onSelectFile,
}: FileExplorerProps) {
  const tree = buildTree(filePaths);

  return (
    <div className="border-b">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Files
        </span>
        <span className="text-xs text-muted-foreground">
          {filePaths.length}
        </span>
      </div>
      <ScrollArea className="max-h-[200px]">
        <div className="px-1 pb-2">
          {tree.map((node) => (
            <TreeItem
              key={node.fullPath}
              node={node}
              depth={0}
              writtenFiles={writtenFiles}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function TreeItem({
  node,
  depth,
  writtenFiles,
  selectedFile,
  onSelectFile,
}: {
  node: TreeNode;
  depth: number;
  writtenFiles: string[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isNew = writtenFiles.includes(node.fullPath);
  const Icon = node.isDirectory
    ? expanded
      ? FolderOpen
      : Folder
    : getFileIcon(node.fullPath);

  if (node.isDirectory) {
    return (
      <div>
        <button
          className="flex w-full items-center gap-1 rounded px-2 py-0.5 text-xs hover:bg-muted transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded &&
          node.children.map((child) => (
            <TreeItem
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              writtenFiles={writtenFiles}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))}
      </div>
    );
  }

  return (
    <button
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-2 py-0.5 text-xs hover:bg-muted transition-colors",
        selectedFile === node.fullPath && "bg-muted font-medium",
      )}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      onClick={() => onSelectFile(node.fullPath)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{node.name}</span>
      {isNew && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
      )}
    </button>
  );
}
