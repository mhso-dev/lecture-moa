"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { createClient } from "~/lib/supabase/client";
import { api } from "~/lib/api";
import type { UpdateProfileRequest, User, UserRole } from "@shared";
import type { AuthError, Provider } from "@supabase/supabase-js";

/**
 * Credentials for email/password sign-in
 */
interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Credentials for sign-up
 */
interface SignUpCredentials {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * Result of a sign-in or sign-up attempt
 */
interface SignInResult {
  success: boolean;
  error?: string;
}

/**
 * Map Supabase AuthError to user-friendly Korean message
 */
function mapAuthError(error: AuthError): string {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials") || message.includes("invalid_credentials")) {
    return "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4";
  }
  if (message.includes("email not confirmed")) {
    return "\uC774\uBA54\uC77C \uC778\uC99D\uC774 \uC644\uB8CC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC778\uC99D \uBA54\uC77C\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.";
  }
  if (message.includes("user already registered") || message.includes("already been registered")) {
    return "\uC774\uBBF8 \uB4F1\uB85D\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4.";
  }
  if (message.includes("password") && message.includes("weak")) {
    return "\uBE44\uBC00\uBC88\uD638\uAC00 \uB108\uBB34 \uC57D\uD569\uB2C8\uB2E4. \uB354 \uAC15\uB825\uD55C \uBE44\uBC00\uBC88\uD638\uB97C \uC0AC\uC6A9\uD574 \uC8FC\uC138\uC694.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "\uC694\uCCAD\uC774 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";
  }
  if (message.includes("signup_disabled")) {
    return "\uD604\uC7AC \uD68C\uC6D0\uAC00\uC785\uC774 \uBE44\uD65C\uC131\uD654\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.";
  }

  return "\uC608\uC0C1\uCE58 \uBABB\uD55C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";
}

/**
 * useAuth - Custom hook for authentication actions
 *
 * Provides:
 * - user, isAuthenticated, isLoading, role from Zustand store
 * - signIn: Email/password sign-in via Supabase Auth
 * - signInWithOAuth: OAuth sign-in (Google, GitHub)
 * - signUp: Email/password registration via Supabase Auth
 * - signOut: Sign out and clear client state
 * - updateUser: Optimistic profile update
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const role = useAuthStore((state) => state.role);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();
  const router = useRouter();

  /**
   * Sign in with email and password credentials.
   * Returns success/error result without redirecting.
   */
  const signIn = useCallback(
    async (credentials: SignInCredentials): Promise<SignInResult> => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) {
          return {
            success: false,
            error: mapAuthError(error),
          };
        }

        return { success: true };
      } catch {
        return {
          success: false,
          error: "\uC608\uC0C1\uCE58 \uBABB\uD55C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",
        };
      }
    },
    []
  );

  /**
   * Sign in with OAuth provider (Google, GitHub).
   * Redirects to the provider's login page.
   */
  const signInWithOAuth = useCallback(
    async (provider: Provider): Promise<void> => {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    },
    []
  );

  /**
   * Sign up with email, password, name, and role.
   * Returns success/error result.
   */
  const signUp = useCallback(
    async (credentials: SignUpCredentials): Promise<SignInResult> => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              name: credentials.name,
              role: credentials.role,
            },
          },
        });

        if (error) {
          return {
            success: false,
            error: mapAuthError(error),
          };
        }

        return { success: true };
      } catch {
        return {
          success: false,
          error: "\uC608\uC0C1\uCE58 \uBABB\uD55C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",
        };
      }
    },
    []
  );

  /**
   * Sign out the current user.
   * Clears Supabase session, Zustand store, and TanStack Query cache.
   * REQ-FE-N14: No stale auth state after sign-out
   */
  const signOut = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAuth();
    queryClient.clear();
    router.push("/");
  }, [clearAuth, queryClient, router]);

  /**
   * Update user profile with optimistic UI update.
   * Updates Zustand store immediately, then sends API request.
   * Reverts on failure.
   */
  const updateUser = useCallback(
    async (data: UpdateProfileRequest): Promise<void> => {
      if (!user) return;

      // Save previous state for rollback
      const previousUser = { ...user };

      // Optimistic update
      const updatedUser: User = {
        ...user,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.image !== undefined && { image: data.image }),
      };
      setUser(updatedUser);

      try {
        await api.patch("/api/users/me", data);
      } catch {
        // Revert on failure
        setUser(previousUser);
        throw new Error("Failed to update profile");
      }
    },
    [user, setUser]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    role,
    signIn,
    signInWithOAuth,
    signUp,
    signOut,
    updateUser,
  };
}
