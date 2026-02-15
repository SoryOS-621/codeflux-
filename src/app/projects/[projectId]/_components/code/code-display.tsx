/**
 * @file _components/code/code-display.tsx
 * @description Renders the currently selected file with syntax highlighting.
 *
 * Uses the shared CodeBlock component (which uses Shiki under the hood).
 * Shows the file path as a breadcrumb header and a copy-all button.
 */

"use client";

import { CodeBlock } from "@/components/shared/code-block";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileCode } from "lucide-react";

interface CodeDisplayProps {
  filePath: string;
  code: string;
  language: string;
}

export function CodeDisplay({ filePath, code, language }: CodeDisplayProps) {
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1];
  const directory = parts.slice(0, -1).join("/");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* File header */}
      <div className="flex items-center gap-2 border-b px-3 py-2 bg-muted/30">
        <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {directory && (
          <>
            <span className="text-xs text-muted-foreground truncate">
              {directory}/
            </span>
          </>
        )}
        <span className="text-xs font-medium truncate">{fileName}</span>
        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
          {language}
        </Badge>
      </div>

      {/* Code content */}
      <ScrollArea className="flex-1">
        <div className="p-0">
          <CodeBlock
            code={code}
            language={language}
            maxHeight="none"
          />
        </div>
      </ScrollArea>
    </div>
  );
}
