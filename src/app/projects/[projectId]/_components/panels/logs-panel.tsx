/**
 * @file _components/panels/logs-panel.tsx
 * @description Build logs panel with filtering (All/Errors/Warnings),
 * auto-scroll toggle, copy, and clear functionality.
 */

"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Copy,
  Trash2,
  ArrowDownToLine,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSandboxStore, type LogEntry } from "@/stores/sandbox-store";
import { toast } from "sonner";

function LogIcon({ level }: { level: LogEntry["level"] }) {
  const icons = {
    info: <Info className="h-3 w-3 text-blue-400" />,
    warn: <AlertTriangle className="h-3 w-3 text-amber-400" />,
    error: <AlertCircle className="h-3 w-3 text-red-400" />,
    debug: <Bug className="h-3 w-3 text-gray-400" />,
  };
  return icons[level] ?? icons.info;
}

function formatLogTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function LogsPanel() {
  const { logFilter, setLogFilter, logsAutoScroll, toggleLogsAutoScroll } = useWorkspaceStore();
  const { logs, clearLogs } = useSandboxStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => {
    if (logFilter === "all") return true;
    if (logFilter === "errors") return log.level === "error";
    if (logFilter === "warnings") return log.level === "warn";
    return true;
  });

  // Auto-scroll
  useEffect(() => {
    if (logsAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [filteredLogs.length, logsAutoScroll]);

  const handleCopy = () => {
    const text = filteredLogs
      .map((l) => `[${formatLogTime(l.timestamp)}] [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Logs copied to clipboard");
  };

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warnCount = logs.filter((l) => l.level === "warn").length;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between h-9 px-3 border-b shrink-0">
        <div className="flex items-center gap-1">
          {(["all", "errors", "warnings"] as const).map((filter) => (
            <Button
              key={filter}
              variant={logFilter === filter ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 text-[10px] gap-1"
              onClick={() => setLogFilter(filter)}
            >
              {filter === "all" && "All"}
              {filter === "errors" && (
                <>
                  Errors
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="h-3.5 min-w-[14px] px-1 text-[8px]">
                      {errorCount}
                    </Badge>
                  )}
                </>
              )}
              {filter === "warnings" && (
                <>
                  Warnings
                  {warnCount > 0 && (
                    <Badge className="h-3.5 min-w-[14px] px-1 text-[8px] bg-amber-500/10 text-amber-400">
                      {warnCount}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6", logsAutoScroll && "text-primary")}
            onClick={toggleLogsAutoScroll}
            title="Auto-scroll"
          >
            <ArrowDownToLine className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title="Copy logs"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearLogs}
            title="Clear logs"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Filter className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">No logs yet</p>
          </div>
        ) : (
          <div className="p-1">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1 }}
                className={cn(
                  "flex items-start gap-2 px-2 py-1 rounded text-[11px] font-mono hover:bg-muted/30 transition-colors",
                  log.level === "error" && "bg-red-500/5",
                  log.level === "warn" && "bg-amber-500/5",
                )}
              >
                <LogIcon level={log.level} />
                <span className="text-muted-foreground/50 shrink-0 tabular-nums">
                  {formatLogTime(log.timestamp)}
                </span>
                {log.source && (
                  <span className="text-muted-foreground/40 shrink-0">[{log.source}]</span>
                )}
                <span className={cn(
                  "flex-1 break-all",
                  log.level === "error" ? "text-red-400" :
                  log.level === "warn" ? "text-amber-400" :
                  "text-foreground/80"
                )}>
                  {log.message}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
