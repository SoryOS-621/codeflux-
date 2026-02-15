/**
 * @file components/theme/theme-provider.tsx
 * @description Wraps the app with next-themes for light/dark mode support.
 *
 * Mount this once in the root layout.tsx. It reads the user's preference
 * from localStorage and applies the `dark` class to <html>.
 */

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
