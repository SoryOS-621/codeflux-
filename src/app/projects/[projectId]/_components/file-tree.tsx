"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Tree node representing either a file or directory */
interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
}

interface FileTreeProps {
  files: Record<string, string>;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

/**
 * Converts a flat file map { "app/page.tsx": "..." }
 * into a nested tree structure for rendering.
 */
function buildTree(files: Record<string, string>): TreeNode[] {
  const root: TreeNode[] = [];

  const sortedPaths = Object.keys(files).sort();

  for (const filePath of sortedPaths) {
    const parts = filePath.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      const existing = current.find((n) => n.name === part);

      if (existing) {
        current = existing.children;
      } else {
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          isDirectory: !isLast,
          children: [],
        };
        current.push(newNode);
        current = newNode.children;
      }
    }
  }

  return root;
}

function TreeItem({
  node,
  depth,
  selectedFile,
  onSelectFile,
  expandedDirs,
  onToggleDir,
}: {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
}) {
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (node.isDirectory) {
      onToggleDir(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  // Determine file icon color based on extension
  const getFileColor = (name: string): string => {
    if (name.endsWith(".tsx") || name.endsWith(".ts")) return "text-blue-400";
    if (name.endsWith(".jsx") || name.endsWith(".js")) return "text-yellow-400";
    if (name.endsWith(".css")) return "text-purple-400";
    if (name.endsWith(".json")) return "text-green-400";
    if (name.endsWith(".md")) return "text-gray-400";
    return "text-muted-foreground";
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 w-full text-left py-1 px-2 text-xs hover:bg-accent/50 transition-colors rounded-sm group",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="size-3 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="size-3 text-muted-foreground shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="size-3.5 text-primary/70 shrink-0" />
            ) : (
              <Folder className="size-3.5 text-primary/70 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="size-3 shrink-0" /> {/* spacer for alignment */}
            <FileText className={cn("size-3.5 shrink-0", getFileColor(node.name))} />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {node.isDirectory && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  const tree = useMemo(() => buildTree(files), [files]);

  // Start with all directories expanded
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => {
    const dirs = new Set<string>();
    const collectDirs = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.isDirectory) {
          dirs.add(node.path);
          collectDirs(node.children);
        }
      }
    };
    collectDirs(buildTree(files));
    return dirs;
  });

  const handleToggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="py-1">
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          depth={0}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          expandedDirs={expandedDirs}
          onToggleDir={handleToggleDir}
        />
      ))}
    </div>
  );
}
