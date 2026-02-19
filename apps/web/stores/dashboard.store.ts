/**
 * Dashboard Store
 * REQ-FE-243: Zustand store for dashboard-specific UI state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Dashboard tab type for future tabbed dashboard view
 */
export type DashboardTab = "student" | "instructor" | "team";

/**
 * Dashboard store state interface
 */
interface DashboardState {
  /** Currently active dashboard tab */
  activeTab: DashboardTab;
  /** Count of unread notifications */
  notificationCount: number;
  /** Whether dashboard data is being refreshed */
  isRefreshing: boolean;
}

/**
 * Dashboard store actions interface
 */
interface DashboardActions {
  /** Set the active dashboard tab */
  setActiveTab: (tab: DashboardTab) => void;
  /** Set the notification count */
  setNotificationCount: (count: number) => void;
  /** Set the refreshing state */
  setIsRefreshing: (isRefreshing: boolean) => void;
  /** Mark all notifications as read (sets count to 0) */
  markAllNotificationsRead: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

const initialState: DashboardState = {
  activeTab: "student",
  notificationCount: 0,
  isRefreshing: false,
};

/**
 * Dashboard Store - Manages dashboard-specific UI state
 *
 * State:
 * - activeTab: Current dashboard tab ('student' | 'instructor' | 'team')
 * - notificationCount: Number of unread notifications
 * - isRefreshing: Whether dashboard is refreshing data
 *
 * Actions:
 * - setActiveTab: Update the active tab
 * - setNotificationCount: Update notification count
 * - setIsRefreshing: Update refresh state
 * - markAllNotificationsRead: Reset notification count to 0
 *
 * @example
 * ```tsx
 * // In a component
 * const { activeTab, setActiveTab, notificationCount } = useDashboardStore();
 *
 * // Set active tab
 * setActiveTab('instructor');
 *
 * // Update notifications
 * setNotificationCount(5);
 *
 * // Mark all as read
 * markAllNotificationsRead();
 * ```
 */
export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setActiveTab: (tab) =>
        set({ activeTab: tab }, false, "dashboard/setActiveTab"),

      setNotificationCount: (count) =>
        set({ notificationCount: count }, false, "dashboard/setNotificationCount"),

      setIsRefreshing: (isRefreshing) =>
        set({ isRefreshing }, false, "dashboard/setIsRefreshing"),

      markAllNotificationsRead: () =>
        set({ notificationCount: 0 }, false, "dashboard/markAllNotificationsRead"),
    }),
    {
      name: "DashboardStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);
