/**
 * @file _components/preview/preview-panel.tsx
 * @description Container for the live preview iframe.
 *
 * Shows the running sandbox preview with a toolbar for refresh,
 * open-in-new-tab, and responsive viewport toggles.
 * Falls back to a loading state or placeholder when no URL is available.
 */

"use client";

import type { WorkspacePhase } from "@/hooks/use-workspace-state";
import { PreviewToolbar } from "./preview-toolbar";
import { PreviewIframe } from "./preview-iframe";
import { PreviewLoading } from "./preview-loading";
import { useState, useCallback } from "react";

interface PreviewPanelProps {
  previewUrl: string | null;
  phase: WorkspacePhase;
}

export type ViewportSize = "mobile" | "tablet" | "desktop";

const viewportWidths: Record<ViewportSize, string> = {
  mobile: "375px",
  tablet: "768px",
  desktop: "100%",
};

export function PreviewPanel({ previewUrl, phase }: PreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleOpenExternal = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  }, [previewUrl]);

  if (!previewUrl) {
    return <PreviewLoading phase={phase} />;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PreviewToolbar
        viewport={viewport}
        onViewportChange={setViewport}
        onRefresh={handleRefresh}
        onOpenExternal={handleOpenExternal}
        previewUrl={previewUrl}
      />
      <div className="flex-1 flex items-start justify-center overflow-auto bg-muted/20 p-2">
        <div
          className="h-full bg-background border rounded-md overflow-hidden transition-all duration-300"
          style={{ width: viewportWidths[viewport] }}
        >
          <PreviewIframe
            key={refreshKey}
            url={previewUrl}
          />
        </div>
      </div>
    </div>
  );
}
