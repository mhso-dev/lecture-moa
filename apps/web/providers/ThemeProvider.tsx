"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

/**
 * ThemeProvider - Wraps application with next-themes for light/dark mode support
 *
 * Features:
 * - System preference detection
 * - Theme persistence via localStorage
 * - Class-based dark mode strategy (Tailwind compatible)
 * - Smooth theme transitions
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "lecture-moa-theme",
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange={false}
      storageKey={storageKey}
    >
      {children}
    </NextThemesProvider>
  );
}
