/**
 * @file _components/panels/terminal-panel.tsx
 * @description Mock terminal output panel with monospace styling.
 */

"use client";

import { useRef, useEffect } from "react";
import { Terminal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSandboxStore } from "@/stores/sandbox-store";

export function TerminalPanel() {
  const { terminalLines, clearTerminal } = useSandboxStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines.length]);

  return (
    <div className="flex h-full flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between h-9 px-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">Terminal</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={clearTerminal}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {terminalLines.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground/40 text-xs font-mono">
            <span className="text-emerald-400">$</span>
            <span className="animate-pulse">_</span>
          </div>
        ) : (
          <div className="space-y-0.5">
            {terminalLines.map((line, idx) => (
              <div
                key={idx}
                className="text-[11px] font-mono text-foreground/80 leading-5 whitespace-pre-wrap break-all"
              >
                {line}
              </div>
            ))}
            <div className="flex items-center gap-2 text-muted-foreground/40 text-[11px] font-mono">
              <span className="text-emerald-400">$</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
