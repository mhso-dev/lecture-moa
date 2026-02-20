"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createClient } from "~/lib/supabase/client";
import { useAuthStore } from "~/stores/auth.store";
import { setApiAuthToken } from "~/lib/api";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Supabase Auth session synchronization
 *
 * Listens to Supabase onAuthStateChange events and keeps
 * the Zustand auth store and API client token in sync.
 *
 * Replaces the previous NextAuth SessionProvider wrapper.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const supabase = createClient();

    // Set initial loading state
    setLoading(true);

    // Check initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.name as string ?? user.email ?? "",
          role: (user.user_metadata?.role as string ?? "student") as "student" | "instructor" | "admin",
          image: user.user_metadata?.avatar_url as string | undefined,
          createdAt: new Date(user.created_at),
        });
        // Get access token for API client
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.access_token) {
            setApiAuthToken(session.access_token);
          }
        }).catch(() => {
          // Session fetch failed; token will not be set
        });
      } else {
        clearAuth();
        setApiAuthToken(null);
      }
      setLoading(false);
    }).catch(() => {
      // Initial user check failed
      clearAuth();
      setApiAuthToken(null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = session.user;
        setUser({
          id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.name as string ?? user.email ?? "",
          role: (user.user_metadata?.role as string ?? "student") as "student" | "instructor" | "admin",
          image: user.user_metadata?.avatar_url as string | undefined,
          createdAt: new Date(user.created_at),
        });
        setApiAuthToken(session.access_token);
      } else {
        clearAuth();
        setApiAuthToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, clearAuth, setLoading]);

  return <>{children}</>;
}
