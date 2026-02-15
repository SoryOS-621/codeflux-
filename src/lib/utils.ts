/**
 * @file utils.ts
 * @description General-purpose utility functions used across the app.
 *
 * ## `cn()` — Tailwind class merging
 * Combines multiple class values using `clsx` (handles conditionals,
 * arrays, objects) and then deduplicates conflicting Tailwind classes
 * using `tailwind-merge` (e.g. `cn("px-2", "px-4")` → `"px-4"`).
 *
 * Import this from `@/lib/utils` everywhere — never from `@/components/ui/utils`.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind CSS class names, resolving conflicts intelligently. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
