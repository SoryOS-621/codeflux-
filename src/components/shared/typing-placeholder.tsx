/**
 * @file components/shared/typing-placeholder.tsx
 * @description Animated placeholder that cycles through example prompts
 * with a typewriter effect.
 *
 * Renders as transparent text behind / inside the textarea area so the user
 * sees the placeholder cycling even when the component is controlled.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const EXAMPLE_PROMPTS = [
  "A todo app with dark mode and local storage",
  "An e-commerce dashboard with analytics charts",
  "A personal portfolio with a blog section",
  "A weather app that shows a 5-day forecast",
  "A Kanban board with drag-and-drop support",
  "A recipe finder with filters and favorites",
];

/** Typing speed in ms per character. */
const TYPE_SPEED = 45;
/** Erasing speed in ms per character. */
const ERASE_SPEED = 25;
/** Pause after fully typed. */
const PAUSE_AFTER_TYPE = 2000;
/** Pause after fully erased before next prompt. */
const PAUSE_AFTER_ERASE = 400;

/**
 * Custom hook that drives the typewriter animation and returns the
 * current display string.
 */
export function useTypingPlaceholder(prompts: string[] = EXAMPLE_PROMPTS) {
  const [display, setDisplay] = useState("");
  const indexRef = useRef(0);
  const dirRef = useRef<"type" | "erase">("type");
  const charRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const tick = useCallback(() => {
    const prompt = prompts[indexRef.current];

    if (dirRef.current === "type") {
      charRef.current += 1;
      setDisplay(prompt.slice(0, charRef.current));

      if (charRef.current >= prompt.length) {
        dirRef.current = "erase";
        timerRef.current = setTimeout(tick, PAUSE_AFTER_TYPE);
      } else {
        timerRef.current = setTimeout(tick, TYPE_SPEED);
      }
    } else {
      charRef.current -= 1;
      setDisplay(prompt.slice(0, charRef.current));

      if (charRef.current <= 0) {
        dirRef.current = "type";
        indexRef.current = (indexRef.current + 1) % prompts.length;
        timerRef.current = setTimeout(tick, PAUSE_AFTER_ERASE);
      } else {
        timerRef.current = setTimeout(tick, ERASE_SPEED);
      }
    }
  }, [prompts]);

  useEffect(() => {
    timerRef.current = setTimeout(tick, PAUSE_AFTER_ERASE);
    return () => clearTimeout(timerRef.current);
  }, [tick]);

  return display;
}
