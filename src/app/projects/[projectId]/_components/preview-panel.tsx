"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PREVIEW_FALLBACK_MESSAGE } from "@/lib/constants";

interface PreviewPanelProps {
  sandboxUrl: string | null;
}

export function PreviewPanel({ sandboxUrl }: PreviewPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setIframeKey((prev) => prev + 1);
    // Reset refreshing state after a delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleOpenExternal = () => {
    if (sandboxUrl) {
      window.open(sandboxUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="h-10 border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Globe className="size-3.5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          {sandboxUrl ? (
            <div className="bg-accent/50 rounded-md px-2.5 py-1 text-xs text-muted-foreground truncate font-mono border border-border">
              {sandboxUrl}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No preview available</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleRefresh}
                disabled={!sandboxUrl}
              >
                <RefreshCw
                  className={cn("size-3.5", isRefreshing && "animate-spin")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh preview</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleOpenExternal}
                disabled={!sandboxUrl}
              >
                <ExternalLink className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in new tab</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 relative">
        {sandboxUrl ? (
          <>
            {isRefreshing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            )}
            <iframe
              key={iframeKey}
              src={sandboxUrl}
              className="w-full h-full border-0"
              title="App Preview"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <div className="size-16 rounded-2xl bg-accent/50 border border-border flex items-center justify-center">
              <Globe className="size-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-center max-w-xs">{PREVIEW_FALLBACK_MESSAGE}</p>
          </div>
        )}
      </div>
    </div>
  );
}
