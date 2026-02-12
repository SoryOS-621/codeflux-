"use client";

import { useEffect, useRef } from "react";

/**
 * Hook that auto-scrolls a container to the bottom when dependencies change.
 * Returns a ref to attach to the scrollable container.
 */
export function useAutoScroll<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
