/**
 * @file hooks/use-local-storage.ts
 * @description Hook for reading/writing values to localStorage with
 * type safety and SSR compatibility.
 *
 * Used to persist UI preferences like panel sizes, theme, view mode, etc.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Read from localStorage on mount (after hydration)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch {
      // localStorage not available or invalid JSON — use initial value
    }
  }, [key]);

  // Write to localStorage whenever value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue =
          value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // localStorage full or not available
        }
        return nextValue;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
