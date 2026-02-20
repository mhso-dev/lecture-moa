import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { User, UserRole } from "@shared";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
};

/**
 * Auth Store - Manages authentication state
 *
 * State:
 * - user: Current authenticated user or null
 * - role: Current user role (student, instructor, admin) or null
 * - isAuthenticated: Boolean flag for auth status
 * - isLoading: Loading state for auth checks
 *
 * Actions:
 * - setUser: Update user and role state directly
 * - login: Set user, role, and mark as authenticated
 * - logout: Clear user/role and mark as unauthenticated
 * - setLoading: Update loading state
 * - clearAuth: Reset all auth state to initial values
 *
 * Persistence:
 * - Only user preference is persisted (not sensitive data)
 * - Session tokens are handled by Supabase Auth
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser: (user) =>
          set(
            {
              user,
              role: user?.role ?? null,
              isAuthenticated: !!user,
            },
            false,
            "auth/setUser"
          ),

        login: (user) =>
          set(
            {
              user,
              role: user.role,
              isAuthenticated: true,
              isLoading: false,
            },
            false,
            "auth/login"
          ),

        logout: () =>
          set(
            {
              user: null,
              role: null,
              isAuthenticated: false,
              isLoading: false,
            },
            false,
            "auth/logout"
          ),

        setLoading: (isLoading) =>
          set({ isLoading }, false, "auth/setLoading"),

        clearAuth: () =>
          set(
            { ...initialState, isLoading: false },
            false,
            "auth/clearAuth"
          ),
      }),
      {
        name: "lecture-moa-auth",
        // Only persist user preference, not sensitive data
        partialize: (state) => ({
          // Note: We don't persist the actual user data for security
          // Session is managed by Supabase Auth
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
