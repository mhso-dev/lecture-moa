"use client";

import { useCallback } from "react";
import {
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth.store";
import { api } from "~/lib/api";
import type { UpdateProfileRequest, User } from "@shared";

/**
 * Credentials for email/password sign-in
 */
interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Result of a sign-in attempt
 */
interface SignInResult {
  success: boolean;
  error?: string;
}

/**
 * useAuth - Custom hook for authentication actions
 *
 * Provides:
 * - user, isAuthenticated, isLoading, role from Zustand store
 * - signIn: Email/password sign-in via next-auth
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

  /**
   * Sign in with email and password credentials.
   * Returns success/error result without redirecting.
   */
  const signIn = useCallback(
    async (credentials: SignInCredentials): Promise<SignInResult> => {
      try {
        const result = await nextAuthSignIn("credentials", {
          email: credentials.email,
          password: credentials.password,
          redirect: false,
        });

        if (result?.error) {
          return {
            success: false,
            error: result.error === "CredentialsSignin"
              ? "Invalid email or password"
              : result.error,
          };
        }

        return { success: true };
      } catch {
        return {
          success: false,
          error: "An unexpected error occurred. Please try again.",
        };
      }
    },
    []
  );

  /**
   * Sign out the current user.
   * Clears next-auth session, Zustand store, and TanStack Query cache.
   * REQ-FE-N14: No stale auth state after sign-out
   */
  const signOut = useCallback(async (): Promise<void> => {
    clearAuth();
    queryClient.clear();
    await nextAuthSignOut({ callbackUrl: "/" });
  }, [clearAuth, queryClient]);

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
    signOut,
    updateUser,
  };
}
