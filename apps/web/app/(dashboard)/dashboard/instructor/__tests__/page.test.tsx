/**
 * Instructor Dashboard Page Tests
 * REQ-FE-202, REQ-FE-203, REQ-FE-220: Instructor dashboard view
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import InstructorDashboardPage from "../page";

// Helper to create mock session with proper typing
function createMockSession(overrides: {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
}): Session {
  return {
    user: {
      id: overrides.id,
      name: overrides.name,
      email: overrides.email,
      role: overrides.role,
      image: null,
    } as Session["user"],
    expires: new Date(Date.now() + 86400000).toISOString(),
    accessToken: "test-token",
  };
}

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    mockRedirect(path);
    // Return never to simulate redirect behavior
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

// Mock auth with proper typing
const mockAuth = vi.fn<() => Promise<Session | null>>();
vi.mock("~/lib/auth", () => ({
  get auth() {
    return mockAuth;
  },
}));

// Mock all widgets
vi.mock("~/components/dashboard/instructor/MyCoursesWidget", () => ({
  MyCoursesWidget: () => <div data-testid="my-courses-widget">My Courses Widget</div>,
}));

vi.mock("~/components/dashboard/instructor/StudentActivityWidget", () => ({
  StudentActivityWidget: () => <div data-testid="student-activity-widget">Student Activity Widget</div>,
}));

vi.mock("~/components/dashboard/instructor/PendingQAWidget", () => ({
  PendingQAWidget: () => <div data-testid="pending-qa-widget">Pending QA Widget</div>,
}));

vi.mock("~/components/dashboard/instructor/QuizPerformanceWidget", () => ({
  QuizPerformanceWidget: () => <div data-testid="quiz-performance-widget">Quiz Performance Widget</div>,
}));

vi.mock("~/components/dashboard/instructor/ActivityFeedWidget", () => ({
  ActivityFeedWidget: () => <div data-testid="activity-feed-widget">Activity Feed Widget</div>,
}));

vi.mock("~/components/dashboard/instructor/QuickActionsWidget", () => ({
  QuickActionsWidget: () => <div data-testid="quick-actions-widget">Quick Actions Widget</div>,
}));

// Create wrapper for TanStack Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("InstructorDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("role protection", () => {
    it("redirects to student dashboard when user is not instructor", async () => {
      mockAuth.mockResolvedValueOnce(
        createMockSession({
          id: "1",
          name: "Student",
          email: "student@test.com",
          role: "student",
        })
      );

      try {
        await InstructorDashboardPage();
      } catch {
        // Expected to throw due to redirect
      }

      expect(mockRedirect).toHaveBeenCalledWith("/dashboard/student");
    });

    it("redirects to login when not authenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      try {
        await InstructorDashboardPage();
      } catch {
        // Expected to throw due to redirect
      }

      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("rendering", () => {
    it("renders all 6 widgets", async () => {
      mockAuth.mockResolvedValueOnce(
        createMockSession({
          id: "1",
          name: "Instructor",
          email: "instructor@test.com",
          role: "instructor",
        })
      );

      const result = await InstructorDashboardPage();

      render(result, { wrapper: createWrapper() });

      expect(screen.getByTestId("my-courses-widget")).toBeInTheDocument();
      expect(screen.getByTestId("student-activity-widget")).toBeInTheDocument();
      expect(screen.getByTestId("pending-qa-widget")).toBeInTheDocument();
      expect(screen.getByTestId("quiz-performance-widget")).toBeInTheDocument();
      expect(screen.getByTestId("activity-feed-widget")).toBeInTheDocument();
      expect(screen.getByTestId("quick-actions-widget")).toBeInTheDocument();
    });

    it("displays welcome message with user name", async () => {
      mockAuth.mockResolvedValueOnce(
        createMockSession({
          id: "1",
          name: "Test Instructor",
          email: "instructor@test.com",
          role: "instructor",
        })
      );

      const result = await InstructorDashboardPage();

      render(result, { wrapper: createWrapper() });

      expect(screen.getByText(/welcome back, test instructor/i)).toBeInTheDocument();
    });

    it("displays dashboard heading", async () => {
      mockAuth.mockResolvedValueOnce(
        createMockSession({
          id: "1",
          name: "Instructor",
          email: "instructor@test.com",
          role: "instructor",
        })
      );

      const result = await InstructorDashboardPage();

      render(result, { wrapper: createWrapper() });

      expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
    });
  });
});
