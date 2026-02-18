import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Navigation State Types
 * REQ-FE-025: Navigation state management
 */
interface NavigationState {
  /** Whether the sidebar is collapsed (desktop) */
  isSidebarCollapsed: boolean;
  /** Whether the mobile menu is open */
  isMobileMenuOpen: boolean;
  /** Currently active route path */
  activeRoute: string;
}

interface NavigationActions {
  /** Toggle sidebar collapsed state */
  toggleSidebar: () => void;
  /** Set sidebar to specific collapsed state */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Toggle mobile menu open state */
  toggleMobileMenu: () => void;
  /** Set mobile menu to specific state */
  setMobileMenuOpen: (open: boolean) => void;
  /** Update active route */
  setActiveRoute: (route: string) => void;
  /** Reset all navigation state */
  reset: () => void;
}

type NavigationStore = NavigationState & NavigationActions;

const initialState: NavigationState = {
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  activeRoute: "/",
};

/**
 * Navigation Store
 * REQ-FE-025: Zustand store with persist middleware
 *
 * Manages navigation state including sidebar collapse state,
 * mobile menu visibility, and active route tracking.
 * Persists to localStorage for state retention across sessions.
 */
export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set) => ({
      ...initialState,

      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      setSidebarCollapsed: (collapsed: boolean) =>
        set({ isSidebarCollapsed: collapsed }),

      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

      setMobileMenuOpen: (open: boolean) => set({ isMobileMenuOpen: open }),

      setActiveRoute: (route: string) => set({ activeRoute: route }),

      reset: () => set(initialState),
    }),
    {
      name: "lecture-moa-navigation",
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        activeRoute: state.activeRoute,
        // Don't persist mobile menu state
      }),
    }
  )
);

// Selector hooks for optimized re-renders
export const useSidebarCollapsed = () =>
  useNavigationStore((state) => state.isSidebarCollapsed);

export const useMobileMenuOpen = () =>
  useNavigationStore((state) => state.isMobileMenuOpen);

export const useActiveRoute = () =>
  useNavigationStore((state) => state.activeRoute);
