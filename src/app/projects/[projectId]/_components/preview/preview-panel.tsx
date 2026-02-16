/**
 * @file _components/preview/preview-panel.tsx
 * @description Premium live preview panel with device switcher, refresh,
 * and responsive iframe container.
 */

"use client";

import type { WorkspacePhase } from "@/hooks/use-workspace-state";
import { PreviewToolbar } from "./preview-toolbar";
import { PreviewIframe } from "./preview-iframe";
import { PreviewLoading } from "./preview-loading";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useWorkspaceStore } from "@/stores/workspace-store";

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
  const deviceViewport = useWorkspaceStore((s) => s.deviceViewport);
  const setDeviceViewport = useWorkspaceStore((s) => s.setDeviceViewport);
  const [refreshKey, setRefreshKey] = useState(0);

  // Map device viewport to the existing ViewportSize type
  const viewport: ViewportSize = deviceViewport === "tablet" ? "tablet" : deviceViewport === "mobile" ? "mobile" : "desktop";

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleOpenExternal = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  }, [previewUrl]);

  const handleViewportChange = useCallback((vp: ViewportSize) => {
    setDeviceViewport(vp);
  }, [setDeviceViewport]);

  if (!previewUrl) {
    return <PreviewLoading phase={phase} />;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PreviewToolbar
        viewport={viewport}
        onViewportChange={handleViewportChange}
        onRefresh={handleRefresh}
        onOpenExternal={handleOpenExternal}
        previewUrl={previewUrl}
      />
      <div className="flex-1 flex items-start justify-center overflow-auto bg-[#0d1117] p-2">
        <motion.div
          layout
          className="h-full bg-background rounded-lg overflow-hidden shadow-xl shadow-black/20"
          style={{ width: viewportWidths[viewport] }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <PreviewIframe
            key={refreshKey}
            url={previewUrl}
          />
        </motion.div>
      </div>
    </div>
  );
}
