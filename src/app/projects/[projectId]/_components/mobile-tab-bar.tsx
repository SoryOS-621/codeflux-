/**
 * @file _components/mobile-tab-bar.tsx
 * @description Bottom tab bar for mobile workspace layout.
 *
 * Switches between Chat, Code, and Preview panels on small screens.
 * Shows badges for file count and a dot indicator when preview is available.
 */

"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, Code2, Eye } from "lucide-react";

export type MobileTab = "chat" | "code" | "preview";

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  /** Number of generated files (shown as badge on Code tab). */
  fileCount: number;
  /** Whether a preview URL is available. */
  hasPreview: boolean;
  /** Whether the agent is currently generating. */
  isGenerating: boolean;
}

const tabs: Array<{
  key: MobileTab;
  label: string;
  icon: typeof MessageSquare;
}> = [
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "code", label: "Code", icon: Code2 },
  { key: "preview", label: "Preview", icon: Eye },
];

export function MobileTabBar({
  activeTab,
  onTabChange,
  fileCount,
  hasPreview,
  isGenerating,
}: MobileTabBarProps) {
  return (
    <nav className="flex items-center border-t bg-background shrink-0">
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;

        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />

              {/* Badge: file count on Code tab */}
              {key === "code" && fileCount > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[14px] h-3.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
                  {fileCount > 99 ? "99+" : fileCount}
                </span>
              )}

              {/* Dot: preview available */}
              {key === "preview" && hasPreview && (
                <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-emerald-500" />
              )}

              {/* Pulsing dot: generating indicator on chat */}
              {key === "chat" && isGenerating && (
                <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
