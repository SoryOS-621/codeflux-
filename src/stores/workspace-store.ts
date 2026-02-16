/**
 * @file stores/workspace-store.ts
 * @description Global workspace state separated from component state.
 * Manages panel visibility, sidebar state, active tabs, and layout preferences.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RightPanelTab = "code" | "preview" | "logs" | "terminal";
export type MobilePanel = "chat" | "sidebar" | "editor" | "logs";
export type DeviceViewport = "desktop" | "tablet" | "mobile";

interface WorkspaceState {
  /** Left sidebar collapsed state */
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  /** Active tab in the right panel (code/preview/logs/terminal) */
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;

  /** Currently selected file in the editor */
  activeFile: string | null;
  setActiveFile: (file: string | null) => void;

  /** Open editor tabs */
  openTabs: string[];
  openTab: (file: string) => void;
  closeTab: (file: string) => void;

  /** Preview device viewport */
  deviceViewport: DeviceViewport;
  setDeviceViewport: (viewport: DeviceViewport) => void;

  /** Mobile active panel */
  mobilePanel: MobilePanel;
  setMobilePanel: (panel: MobilePanel) => void;

  /** Agent workflow panel expanded */
  agentPanelExpanded: boolean;
  toggleAgentPanel: () => void;

  /** Build logs auto-scroll */
  logsAutoScroll: boolean;
  toggleLogsAutoScroll: () => void;

  /** Log filter */
  logFilter: "all" | "errors" | "warnings";
  setLogFilter: (filter: "all" | "errors" | "warnings") => void;

  /** Execution paused */
  executionPaused: boolean;
  toggleExecutionPaused: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      rightPanelTab: "code",
      setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

      activeFile: null,
      setActiveFile: (file) => set({ activeFile: file }),

      openTabs: [],
      openTab: (file) => {
        const tabs = get().openTabs;
        if (!tabs.includes(file)) {
          set({ openTabs: [...tabs, file], activeFile: file });
        } else {
          set({ activeFile: file });
        }
      },
      closeTab: (file) => {
        const tabs = get().openTabs.filter((t) => t !== file);
        const activeFile = get().activeFile;
        if (activeFile === file) {
          set({ openTabs: tabs, activeFile: tabs[tabs.length - 1] ?? null });
        } else {
          set({ openTabs: tabs });
        }
      },

      deviceViewport: "desktop",
      setDeviceViewport: (viewport) => set({ deviceViewport: viewport }),

      mobilePanel: "chat",
      setMobilePanel: (panel) => set({ mobilePanel: panel }),

      agentPanelExpanded: false,
      toggleAgentPanel: () =>
        set((s) => ({ agentPanelExpanded: !s.agentPanelExpanded })),

      logsAutoScroll: true,
      toggleLogsAutoScroll: () =>
        set((s) => ({ logsAutoScroll: !s.logsAutoScroll })),

      logFilter: "all",
      setLogFilter: (filter) => set({ logFilter: filter }),

      executionPaused: false,
      toggleExecutionPaused: () =>
        set((s) => ({ executionPaused: !s.executionPaused })),
    }),
    {
      name: "codeflux-workspace",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        deviceViewport: state.deviceViewport,
        logsAutoScroll: state.logsAutoScroll,
        logFilter: state.logFilter,
      }),
    },
  ),
);
