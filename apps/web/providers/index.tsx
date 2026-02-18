"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";

// Dynamically import Toaster to avoid SSR issues
const Toaster = dynamic(
  () => import("~/components/ui/sonner").then((mod) => mod.Toaster),
  { ssr: false }
);

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers - Composes all application providers in correct nesting order
 *
 * Provider nesting order (outermost to innermost):
 * 1. ThemeProvider - Dark mode support (outermost for class attribute)
 * 2. QueryProvider - TanStack Query for server state
 * 3. AuthProvider - NextAuth session management
 * 4. Toaster - Toast notifications (rendered last for z-index)
 *
 * Note: All providers are client components ("use client")
 * This is required because they use React hooks and browser APIs
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

// Re-export individual providers for direct usage if needed
export { ThemeProvider } from "./ThemeProvider";
export { QueryProvider } from "./QueryProvider";
export { AuthProvider } from "./AuthProvider";
