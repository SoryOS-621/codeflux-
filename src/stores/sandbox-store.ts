/**
 * @file stores/sandbox-store.ts
 * @description Mock sandbox status state — CPU, memory, build status, deployment state.
 */

import { create } from "zustand";

export type BuildStatus = "idle" | "building" | "success" | "error";
export type DeployStatus = "not-deployed" | "deploying" | "deployed" | "failed";

interface SandboxState {
  /** Sandbox ID */
  sandboxId: string | null;
  setSandboxId: (id: string | null) => void;

  /** Build status */
  buildStatus: BuildStatus;
  setBuildStatus: (status: BuildStatus) => void;

  /** Deploy status */
  deployStatus: DeployStatus;
  setDeployStatus: (status: DeployStatus) => void;

  /** Mock CPU usage (0-100) */
  cpuUsage: number;
  setCpuUsage: (usage: number) => void;

  /** Mock memory usage (0-100) */
  memoryUsage: number;
  setMemoryUsage: (usage: number) => void;

  /** Mock token usage */
  tokensUsed: number;
  tokensLimit: number;
  setTokensUsed: (tokens: number) => void;

  /** Build logs */
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  clearLogs: () => void;

  /** Terminal output lines */
  terminalLines: string[];
  addTerminalLine: (line: string) => void;
  clearTerminal: () => void;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source?: string;
}

let logCounter = 0;

export const useSandboxStore = create<SandboxState>()((set, _get) => ({
  sandboxId: null,
  setSandboxId: (id) => set({ sandboxId: id }),

  buildStatus: "idle",
  setBuildStatus: (status) => set({ buildStatus: status }),

  deployStatus: "not-deployed",
  setDeployStatus: (status) => set({ deployStatus: status }),

  cpuUsage: 0,
  setCpuUsage: (usage) => set({ cpuUsage: usage }),

  memoryUsage: 0,
  setMemoryUsage: (usage) => set({ memoryUsage: usage }),

  tokensUsed: 0,
  tokensLimit: 100000,
  setTokensUsed: (tokens) => set({ tokensUsed: tokens }),

  logs: [],
  addLog: (entry) => {
    logCounter++;
    set((s) => ({
      logs: [
        ...s.logs,
        {
          ...entry,
          id: `log-${logCounter}`,
          timestamp: new Date(),
        },
      ].slice(-500), // Keep last 500 logs
    }));
  },
  clearLogs: () => set({ logs: [] }),

  terminalLines: [],
  addTerminalLine: (line) =>
    set((s) => ({
      terminalLines: [...s.terminalLines, line].slice(-200),
    })),
  clearTerminal: () => set({ terminalLines: [] }),
}));
