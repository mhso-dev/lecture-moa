"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useAuthStore } from "~/stores/auth.store";
import { setApiAuthToken } from "~/lib/api";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthSync - Internal component that synchronizes next-auth session
 * with the Zustand auth store and API client token.
 *
 * Must be rendered inside SessionProvider.
 */
function AuthSync({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Sync session user to Zustand store
      setUser({
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? "",
        role: session.user.role,
        image: session.user.image ?? undefined,
        createdAt: new Date(),
      });
      setLoading(false);

      // Sync access token to API client
      setApiAuthToken(session.accessToken);
    }

    if (status === "unauthenticated") {
      clearAuth();
      setApiAuthToken(null);
    }
  }, [session, status, setUser, setLoading, clearAuth]);

  return <>{children}</>;
}

/**
 * AuthProvider - NextAuth v5 SessionProvider wrapper
 *
 * Wraps the application with next-auth SessionProvider and
 * an internal AuthSync component that keeps Zustand store
 * and API client in sync with the session.
 *
 * SessionProvider polls for session updates every 5 minutes
 * to detect token refresh and session expiry.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider refetchInterval={300}>
      <AuthSync>{children}</AuthSync>
    </SessionProvider>
  );
}
