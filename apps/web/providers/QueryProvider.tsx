"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider - TanStack Query v5 provider with sensible defaults
 *
 * Configuration:
 * - staleTime: 5 minutes (data considered fresh)
 * - retry: 1 (single retry on failure)
 * - refetchOnWindowFocus: false (prevent unnecessary refetches)
 * - DevTools enabled in development mode
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Only retry once on failure
            retry: 1,
            // Don't refetch when window regains focus
            refetchOnWindowFocus: false,
            // Don't refetch on mount if data is fresh
            refetchOnMount: true,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
