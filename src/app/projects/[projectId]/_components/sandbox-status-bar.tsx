/**
 * @file _components/sandbox-status-bar.tsx
 * @description Top status bar showing build status, sandbox info, CPU/memory,
 * deployment status, and real-time clock. Premium, minimal design.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Circle,
  Cpu,
  HardDrive,
  Rocket,
  Clock,
  Box,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSandboxStore, type BuildStatus, type DeployStatus } from "@/stores/sandbox-store";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function BuildStatusIndicator({ status }: { status: BuildStatus }) {
  const config = {
    idle: { icon: Circle, label: "Idle", color: "text-muted-foreground" },
    building: { icon: Loader2, label: "Building", color: "text-warning" },
    success: { icon: CheckCircle2, label: "Built", color: "text-success" },
    error: { icon: AlertCircle, label: "Build Error", color: "text-destructive" },
  };
  const { icon: Icon, label, color } = config[status];

  return (
    <div className={cn("flex items-center gap-1.5 text-xs", color)}>
      <Icon className={cn("h-3 w-3", status === "building" && "animate-spin")} />
      <span className="font-medium">{label}</span>
    </div>
  );
}

function DeployStatusIndicator({ status }: { status: DeployStatus }) {
  const config = {
    "not-deployed": { label: "Not Deployed", color: "text-muted-foreground" },
    deploying: { label: "Deploying...", color: "text-info" },
    deployed: { label: "Live", color: "text-success" },
    failed: { label: "Deploy Failed", color: "text-destructive" },
  };
  const { label, color } = config[status];

  return (
    <div className={cn("flex items-center gap-1.5 text-xs", color)}>
      <Rocket className="h-3 w-3" />
      <span className="font-medium">{label}</span>
      {status === "deployed" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
      )}
    </div>
  );
}

function UsageBar({ value, label, icon: Icon }: { value: number; label: string; icon: React.ElementType }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Icon className="h-3 w-3 text-muted-foreground" />
            <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  value > 80 ? "bg-destructive" : value > 50 ? "bg-warning" : "bg-primary"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-7 text-right">
              {value}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label}: {value}%
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SandboxStatusBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { buildStatus, deployStatus, cpuUsage, memoryUsage, sandboxId } = useSandboxStore();

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-7 items-center justify-between border-b bg-card/50 px-3 text-xs shrink-0 select-none"
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        <BuildStatusIndicator status={buildStatus} />
        <div className="h-3 w-px bg-border" />
        <DeployStatusIndicator status={deployStatus} />
      </div>

      {/* Center section */}
      <div className="hidden md:flex items-center gap-4">
        <UsageBar value={cpuUsage} label="CPU" icon={Cpu} />
        <UsageBar value={memoryUsage} label="Memory" icon={HardDrive} />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 text-muted-foreground">
        {sandboxId && (
          <div className="hidden lg:flex items-center gap-1">
            <Box className="h-3 w-3" />
            <span className="font-mono text-[10px]">{sandboxId.slice(0, 8)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span className="font-mono text-[10px] tabular-nums">{formatTime(currentTime)}</span>
        </div>
      </div>
    </motion.div>
  );
}
