"use client";

import type { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - NextAuth v5 SessionProvider wrapper
 *
 * This is a placeholder provider that currently just passes through children.
 * Will be replaced with next-auth SessionProvider in FE-002.
 *
 * TODO (FE-002):
 * - Add next-auth SessionProvider
 * - Configure session refresh interval
 * - Add session error handling
 * - Implement session-based routing protection
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Placeholder: Just render children until auth is implemented
  return <>{children}</>;
}
