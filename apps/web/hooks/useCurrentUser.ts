"use client";

import { useQuery } from "@tanstack/react-query";
import { api, ApiClientError } from "~/lib/api";
import type { User } from "@shared";
import { useAuth } from "./useAuth";

/**
 * useCurrentUser - Fetches and caches the current user profile
 *
 * Uses TanStack Query for caching with 5-minute stale time.
 * Automatically signs out on 401 unauthorized errors.
 *
 * @returns Current user data, loading state, error, and refetch function
 */
export function useCurrentUser() {
  const { isAuthenticated, signOut } = useAuth();

  const query = useQuery<User>({
    queryKey: ["users", "me"],
    queryFn: async () => {
      try {
        const response = await api.get<User>("/api/users/me");
        return response.data;
      } catch (error) {
        // Sign out on 401 unauthorized
        if (error instanceof ApiClientError && error.statusCode === 401) {
          await signOut();
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
