/**
 * @file hooks/use-keyboard-shortcuts.ts
 * @description Global keyboard shortcut handler.
 *
 * Registers shortcuts that work across the app:
 * - Ctrl/Cmd+K  → Focus the prompt input (or search)
 * - Ctrl/Cmd+Enter → Submit the current form
 * - Ctrl/Cmd+B  → Toggle sidebar (future)
 *
 * Usage:
 * ```tsx
 * useKeyboardShortcuts({
 *   onFocusPrompt: () => promptRef.current?.focus(),
 *   onSubmit: () => handleSubmit(),
 * });
 * ```
 */

"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcutHandlers {
  /** Ctrl/Cmd + K: Focus prompt or search input. */
  onFocusPrompt?: () => void;
  /** Ctrl/Cmd + Enter: Submit current action. */
  onSubmit?: () => void;
  /** Ctrl/Cmd + B: Toggle sidebar. */
  onToggleSidebar?: () => void;
  /** Ctrl/Cmd + Shift + P: Command palette (future). */
  onCommandPalette?: () => void;
  /** Escape: Close current overlay / deselect. */
  onEscape?: () => void;
}

/**
 * Registers global keyboard shortcuts. The hook attaches a single
 * keydown listener on mount and removes it on unmount.
 *
 * All handlers are optional — only shortcuts with registered handlers fire.
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + K → Focus prompt
      if (mod && e.key === "k") {
        e.preventDefault();
        handlers.onFocusPrompt?.();
        return;
      }

      // Ctrl/Cmd + Enter → Submit
      if (mod && e.key === "Enter") {
        e.preventDefault();
        handlers.onSubmit?.();
        return;
      }

      // Ctrl/Cmd + B → Toggle sidebar
      if (mod && e.key === "b") {
        e.preventDefault();
        handlers.onToggleSidebar?.();
        return;
      }

      // Ctrl/Cmd + Shift + P → Command palette
      if (mod && e.shiftKey && e.key === "P") {
        e.preventDefault();
        handlers.onCommandPalette?.();
        return;
      }

      // Escape → Close / deselect
      if (e.key === "Escape") {
        handlers.onEscape?.();
        return;
      }
    },
    [handlers],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
