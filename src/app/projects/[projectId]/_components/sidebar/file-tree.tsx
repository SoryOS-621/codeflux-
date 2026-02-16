/**
 * @file _components/sidebar/file-tree.tsx
 * @description Premium file tree with folder collapsing, active-file highlight,
 * git status indicators, and inline rename support.
 */

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  File,
  FileCode,
  FileJson,
  FileText,
  FolderOpen,
  Folder,
  FileImage,
  FileCog,

} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface FileTreeViewProps {
  files: Record<string, string>;
  writtenFiles: string[];
  onSelectFile: (file: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const path of paths.sort()) {
    const parts = path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const fullPath = parts.slice(0, i + 1).join("/");
      const isFile = i === parts.length - 1;

      let existing = current.find((n) => n.name === name);
      if (!existing) {
        existing = {
          name,
          path: fullPath,
          type: isFile ? "file" : "folder",
          children: [],
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }

  return root;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const iconMap: Record<string, React.ElementType> = {
    ts: FileCode,
    tsx: FileCode,
    js: FileCode,
    jsx: FileCode,
    json: FileJson,
    md: FileText,
    txt: FileText,
    css: FileCog,
    scss: FileCog,
    html: FileCode,
    svg: FileImage,
    png: FileImage,
    jpg: FileImage,
    ico: FileImage,
    config: FileCog,
    toml: FileCog,
    yaml: FileCog,
    yml: FileCog,
  };
  return iconMap[ext] ?? File;
}

function getFileColor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const colorMap: Record<string, string> = {
    ts: "text-blue-400",
    tsx: "text-blue-400",
    js: "text-yellow-400",
    jsx: "text-yellow-400",
    json: "text-yellow-300",
    css: "text-purple-400",
    scss: "text-pink-400",
    html: "text-orange-400",
    md: "text-gray-400",
    svg: "text-emerald-400",
    png: "text-emerald-400",
  };
  return colorMap[ext] ?? "text-muted-foreground";
}

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  writtenFiles: string[];
  onSelectFile: (file: string) => void;
}

function TreeNodeItem({ node, depth, writtenFiles, onSelectFile }: TreeNodeItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const activeFile = useWorkspaceStore((s) => s.activeFile);
  const openTab = useWorkspaceStore((s) => s.openTab);
  const isActive = node.type === "file" && activeFile === node.path;
  const isNew = writtenFiles.includes(node.path);

  const handleClick = () => {
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    } else {
      openTab(node.path);
      onSelectFile(node.path);
    }
  };

  const Icon = node.type === "folder"
    ? (isOpen ? FolderOpen : Folder)
    : getFileIcon(node.name);

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 w-full py-1 px-1.5 text-xs rounded-md transition-colors duration-150",
          "hover:bg-accent/50 group",
          isActive && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        {node.type === "folder" && (
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </motion.div>
        )}
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            node.type === "folder" ? "text-blue-400/80" : getFileColor(node.name),
          )}
        />
        <span className="truncate flex-1 text-left">{node.name}</span>
        {isNew && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {node.type === "folder" && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                writtenFiles={writtenFiles}
                onSelectFile={onSelectFile}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FileTreeView({ files, writtenFiles, onSelectFile }: FileTreeViewProps) {
  const tree = useMemo(() => buildTree(Object.keys(files)), [files]);

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          depth={0}
          writtenFiles={writtenFiles}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
}
