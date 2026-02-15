/**
 * @file _components/preview/preview-toolbar.tsx
 * @description Toolbar for the preview panel with viewport toggles,
 * refresh, and open-in-new-tab actions.
 */

"use client";

import type { ViewportSize } from "./preview-panel";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCw,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewToolbarProps {
  viewport: ViewportSize;
  onViewportChange: (v: ViewportSize) => void;
  onRefresh: () => void;
  onOpenExternal: () => void;
  previewUrl: string;
}

const viewportOptions: { value: ViewportSize; icon: typeof Monitor; label: string }[] = [
  { value: "mobile", icon: Smartphone, label: "Mobile (375px)" },
  { value: "tablet", icon: Tablet, label: "Tablet (768px)" },
  { value: "desktop", icon: Monitor, label: "Desktop (100%)" },
];

export function PreviewToolbar({
  viewport,
  onViewportChange,
  onRefresh,
  onOpenExternal,
}: PreviewToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">
            Preview
          </span>

          {/* Viewport toggles */}
          <div className="flex items-center rounded-md border bg-muted/40 p-0.5">
            {viewportOptions.map(({ value, icon: Icon, label }) => (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0",
                      viewport === value && "bg-background shadow-sm",
                    )}
                    onClick={() => onViewportChange(value)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="sr-only">{label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onRefresh}>
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="sr-only">Refresh preview</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Refresh
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onOpenExternal}>
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="sr-only">Open in new tab</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Open in new tab
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
