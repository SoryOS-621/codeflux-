/**
 * @file _components/panels/terminal-panel.tsx
 * @description Real-time terminal output panel with command highlighting.
 * Shows sandbox commands ($ prefix) and their output streamed from SSE events.
 */

"use client";

import { useRef, useEffect } from "react";
import { Terminal, Trash2, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSandboxStore } from "@/stores/sandbox-store";
import { cn } from "@/lib/utils";

export function TerminalPanel() {
  const { terminalLines, clearTerminal } = useSandboxStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines.length]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between h-9 px-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">Terminal</span>
          {terminalLines.length > 0 && (
            <span className="text-[9px] text-muted-foreground/40 ml-1">
              {terminalLines.length} lines
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={scrollToBottom}
            title="Scroll to bottom"
          >
            <ArrowDownToLine className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearTerminal}
            title="Clear terminal"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {terminalLines.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground/40 text-xs font-mono">
            <span className="text-emerald-400">$</span>
            <span className="animate-pulse">_</span>
          </div>
        ) : (
          <div className="space-y-0">
            {terminalLines.map((line, idx) => {
              const isCommand = line.startsWith("$ ");
              return (
                <div
                  key={idx}
                  className={cn(
                    "text-[11px] font-mono leading-5 whitespace-pre-wrap break-all",
                    isCommand
                      ? "text-emerald-400 font-semibold mt-2 first:mt-0"
                      : "text-foreground/70 pl-0",
                    // Highlight error-like lines
                    !isCommand && /error|Error|ERR!|FAIL/i.test(line) && "text-red-400",
                    !isCommand && /warn|Warning/i.test(line) && "text-amber-400",
                  )}
                >
                  {line}
                </div>
              );
            })}
            <div className="flex items-center gap-2 text-muted-foreground/40 text-[11px] font-mono mt-1">
              <span className="text-emerald-400">$</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
