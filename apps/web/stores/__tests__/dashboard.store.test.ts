/**
 * Dashboard Store Tests
 * REQ-FE-243: Zustand store for dashboard-specific UI state
 */

import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useDashboardStore } from "../dashboard.store";

describe("Dashboard Store", () => {
  // Reset store before each test
  beforeEach(() => {
    useDashboardStore.setState({
      activeTab: "student",
      notificationCount: 0,
      isRefreshing: false,
    });
  });

  describe("initial state", () => {
    it("has default activeTab as 'student'", () => {
      const { activeTab } = useDashboardStore.getState();
      expect(activeTab).toBe("student");
    });

    it("has default notificationCount as 0", () => {
      const { notificationCount } = useDashboardStore.getState();
      expect(notificationCount).toBe(0);
    });

    it("has default isRefreshing as false", () => {
      const { isRefreshing } = useDashboardStore.getState();
      expect(isRefreshing).toBe(false);
    });
  });

  describe("setActiveTab action", () => {
    it("sets activeTab to 'student'", () => {
      act(() => {
        useDashboardStore.getState().setActiveTab("student");
      });

      expect(useDashboardStore.getState().activeTab).toBe("student");
    });

    it("sets activeTab to 'instructor'", () => {
      act(() => {
        useDashboardStore.getState().setActiveTab("instructor");
      });

      expect(useDashboardStore.getState().activeTab).toBe("instructor");
    });

    it("sets activeTab to 'team'", () => {
      act(() => {
        useDashboardStore.getState().setActiveTab("team");
      });

      expect(useDashboardStore.getState().activeTab).toBe("team");
    });
  });

  describe("setNotificationCount action", () => {
    it("sets notificationCount to a positive number", () => {
      act(() => {
        useDashboardStore.getState().setNotificationCount(5);
      });

      expect(useDashboardStore.getState().notificationCount).toBe(5);
    });

    it("sets notificationCount to 0", () => {
      act(() => {
        useDashboardStore.getState().setNotificationCount(5);
      });

      act(() => {
        useDashboardStore.getState().setNotificationCount(0);
      });

      expect(useDashboardStore.getState().notificationCount).toBe(0);
    });

    it("increments notificationCount", () => {
      act(() => {
        useDashboardStore.getState().setNotificationCount(3);
      });

      act(() => {
        const { notificationCount, setNotificationCount } = useDashboardStore.getState();
        setNotificationCount(notificationCount + 2);
      });

      expect(useDashboardStore.getState().notificationCount).toBe(5);
    });
  });

  describe("setIsRefreshing action", () => {
    it("sets isRefreshing to true", () => {
      act(() => {
        useDashboardStore.getState().setIsRefreshing(true);
      });

      expect(useDashboardStore.getState().isRefreshing).toBe(true);
    });

    it("sets isRefreshing to false", () => {
      act(() => {
        useDashboardStore.getState().setIsRefreshing(true);
      });

      act(() => {
        useDashboardStore.getState().setIsRefreshing(false);
      });

      expect(useDashboardStore.getState().isRefreshing).toBe(false);
    });
  });

  describe("markAllNotificationsRead action", () => {
    it("sets notificationCount to 0", () => {
      // First set some notifications
      act(() => {
        useDashboardStore.getState().setNotificationCount(10);
      });

      expect(useDashboardStore.getState().notificationCount).toBe(10);

      // Mark all as read
      act(() => {
        useDashboardStore.getState().markAllNotificationsRead();
      });

      expect(useDashboardStore.getState().notificationCount).toBe(0);
    });

    it("does nothing when notificationCount is already 0", () => {
      act(() => {
        useDashboardStore.getState().markAllNotificationsRead();
      });

      expect(useDashboardStore.getState().notificationCount).toBe(0);
    });
  });

  describe("state immutability", () => {
    it("maintains separate state instances", () => {
      const state1 = useDashboardStore.getState();

      act(() => {
        useDashboardStore.getState().setActiveTab("instructor");
      });

      const state2 = useDashboardStore.getState();

      expect(state1.activeTab).toBe("student");
      expect(state2.activeTab).toBe("instructor");
    });
  });
});
