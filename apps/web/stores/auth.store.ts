import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { User } from "@shared";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

/**
 * Auth Store - Manages authentication state
 *
 * State:
 * - user: Current authenticated user or null
 * - isAuthenticated: Boolean flag for auth status
 * - isLoading: Loading state for auth checks
 *
 * Actions:
 * - setUser: Update user state directly
 * - login: Set user and mark as authenticated
 * - logout: Clear user and mark as unauthenticated
 * - setLoading: Update loading state
 *
 * Persistence:
 * - Only user preference is persisted (not sensitive data)
 * - Session tokens are handled by next-auth
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser: (user) =>
          set(
            { user, isAuthenticated: !!user },
            false,
            "auth/setUser"
          ),

        login: (user) =>
          set(
            { user, isAuthenticated: true, isLoading: false },
            false,
            "auth/login"
          ),

        logout: () =>
          set(
            { user: null, isAuthenticated: false, isLoading: false },
            false,
            "auth/logout"
          ),

        setLoading: (isLoading) =>
          set({ isLoading }, false, "auth/setLoading"),
      }),
      {
        name: "lecture-moa-auth",
        // Only persist user preference, not sensitive data
        partialize: (state) => ({
          // Note: We don't persist the actual user data for security
          // Session is managed by next-auth
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: "AuthStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);
