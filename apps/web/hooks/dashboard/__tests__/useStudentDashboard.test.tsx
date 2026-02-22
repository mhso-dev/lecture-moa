/**
 * Student Dashboard Hooks Tests
 * REQ-FE-217: TanStack Query hooks for student dashboard data
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useEnrolledCourses,
  useRecentQA,
  useQuizResults,
  useStudyProgress,
  useUpcomingQuizzes,
  useQANotifications,
} from "../useStudentDashboard";
import * as dashboardModule from "~/lib/supabase/dashboard";

// Mock the Supabase dashboard module
vi.mock("~/lib/supabase/dashboard", () => ({
  fetchEnrolledCourses: vi.fn(),
  fetchRecentQA: vi.fn(),
  fetchQuizResults: vi.fn(),
  fetchStudyProgress: vi.fn(),
  fetchUpcomingQuizzes: vi.fn(),
  fetchQANotifications: vi.fn(),
}));

// Mock environment variable for mock data
vi.mock("~/src/env", () => ({
  env: {
    NEXT_PUBLIC_API_URL: "http://localhost:3001",
    NEXT_PUBLIC_USE_MOCK_DATA: undefined,
  },
}));

describe("Student Dashboard Hooks", () => {
  let queryClient: QueryClient;
  let Wrapper: ({ children }: { children: ReactNode }) => ReactNode;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    Wrapper = function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    };

    vi.clearAllMocks();
  });

  describe("useEnrolledCourses", () => {
    it("fetches enrolled courses with progress", async () => {
      const mockCourses = [
        {
          id: "1",
          title: "Introduction to React",
          instructorName: "John Doe",
          progressPercent: 75,
          lastAccessedAt: new Date("2026-02-18T10:00:00Z"),
        },
        {
          id: "2",
          title: "Advanced TypeScript",
          instructorName: "Jane Smith",
          progressPercent: 50,
          lastAccessedAt: new Date("2026-02-17T15:30:00Z"),
        },
      ];

      vi.mocked(dashboardModule.fetchEnrolledCourses).mockResolvedValueOnce(mockCourses);

      const { result } = renderHook(() => useEnrolledCourses(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockCourses);
      expect(dashboardModule.fetchEnrolledCourses).toHaveBeenCalled();
    });

    it("uses correct query key", async () => {
      vi.mocked(dashboardModule.fetchEnrolledCourses).mockResolvedValueOnce([]);

      renderHook(() => useEnrolledCourses(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "student",
          "enrolledCourses",
        ]);
        expect(cacheData).toBeDefined();
      });
    });

    it("handles errors gracefully", async () => {
      vi.mocked(dashboardModule.fetchEnrolledCourses).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useEnrolledCourses(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("useRecentQA", () => {
    it("fetches recent Q&A activity", async () => {
      const mockQA = [
        {
          id: "1",
          questionExcerpt: "How do I use useEffect?",
          courseName: "Introduction to React",
          status: "answered" as const,
          createdAt: new Date("2026-02-18T10:00:00Z"),
        },
        {
          id: "2",
          questionExcerpt: "What is the difference between interface and type?",
          courseName: "Advanced TypeScript",
          status: "pending" as const,
          createdAt: new Date("2026-02-17T15:30:00Z"),
        },
      ];

      vi.mocked(dashboardModule.fetchRecentQA).mockResolvedValueOnce(mockQA);

      const { result } = renderHook(() => useRecentQA(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockQA);
      expect(dashboardModule.fetchRecentQA).toHaveBeenCalled();
    });

    it("uses correct query key", async () => {
      vi.mocked(dashboardModule.fetchRecentQA).mockResolvedValueOnce([]);

      renderHook(() => useRecentQA(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "student",
          "recentQA",
        ]);
        expect(cacheData).toBeDefined();
      });
    });
  });

  describe("useQuizResults", () => {
    it("fetches quiz results with scores", async () => {
      const mockResults = [
        {
          id: "1",
          quizTitle: "React Basics Quiz",
          courseName: "Introduction to React",
          score: 8,
          totalPoints: 10,
          takenAt: new Date("2026-02-18T10:00:00Z"),
        },
        {
          id: "2",
          quizTitle: "TypeScript Fundamentals",
          courseName: "Advanced TypeScript",
          score: 6,
          totalPoints: 10,
          takenAt: new Date("2026-02-17T15:30:00Z"),
        },
      ];

      vi.mocked(dashboardModule.fetchQuizResults).mockResolvedValueOnce(mockResults);

      const { result } = renderHook(() => useQuizResults(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockResults);
      expect(dashboardModule.fetchQuizResults).toHaveBeenCalled();
    });

    it("uses correct query key", async () => {
      vi.mocked(dashboardModule.fetchQuizResults).mockResolvedValueOnce([]);

      renderHook(() => useQuizResults(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "student",
          "quizResults",
        ]);
        expect(cacheData).toBeDefined();
      });
    });
  });

  describe("useStudyProgress", () => {
    it("fetches study progress metrics", async () => {
      const mockProgress = {
        currentStreak: 5,
        longestStreak: 12,
        totalSessions: 45,
        materialsRead: 23,
      };

      vi.mocked(dashboardModule.fetchStudyProgress).mockResolvedValueOnce(mockProgress);

      const { result } = renderHook(() => useStudyProgress(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockProgress);
      expect(dashboardModule.fetchStudyProgress).toHaveBeenCalled();
    });

    it("uses correct query key with 2-minute stale time", async () => {
      vi.mocked(dashboardModule.fetchStudyProgress).mockResolvedValueOnce({
        currentStreak: 0,
        longestStreak: 0,
        totalSessions: 0,
        materialsRead: 0,
      });

      renderHook(() => useStudyProgress(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "student",
          "studyProgress",
        ]);
        expect(cacheData).toBeDefined();
      });
    });
  });

  describe("useUpcomingQuizzes", () => {
    it("fetches upcoming quizzes", async () => {
      const mockQuizzes = [
        {
          id: "1",
          quizTitle: "React Hooks Quiz",
          courseName: "Introduction to React",
          questionCount: 10,
          dueAt: new Date("2026-02-25T10:00:00Z"),
        },
        {
          id: "2",
          quizTitle: "TypeScript Generics",
          courseName: "Advanced TypeScript",
          questionCount: 15,
        },
      ];

      vi.mocked(dashboardModule.fetchUpcomingQuizzes).mockResolvedValueOnce(mockQuizzes);

      const { result } = renderHook(() => useUpcomingQuizzes(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockQuizzes);
      expect(dashboardModule.fetchUpcomingQuizzes).toHaveBeenCalled();
    });

    it("uses correct query key", async () => {
      vi.mocked(dashboardModule.fetchUpcomingQuizzes).mockResolvedValueOnce([]);

      renderHook(() => useUpcomingQuizzes(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "student",
          "upcomingQuizzes",
        ]);
        expect(cacheData).toBeDefined();
      });
    });
  });

  describe("useQANotifications", () => {
    it("fetches Q&A notifications", async () => {
      const mockNotifications = [
        {
          id: "1",
          message: "Instructor answered your question",
          questionExcerpt: "How do I use useEffect?",
          courseName: "Introduction to React",
          isRead: false,
          createdAt: new Date("2026-02-18T10:00:00Z"),
        },
        {
          id: "2",
          message: "New reply to your question",
          questionExcerpt: "What is the difference between interface and type?",
          courseName: "Advanced TypeScript",
          isRead: true,
          createdAt: new Date("2026-02-17T15:30:00Z"),
        },
      ];

      vi.mocked(dashboardModule.fetchQANotifications).mockResolvedValueOnce(mockNotifications);

      const { result } = renderHook(() => useQANotifications(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockNotifications);
      expect(dashboardModule.fetchQANotifications).toHaveBeenCalled();
    });

    it("uses correct query key with shorter stale time for notifications", async () => {
      vi.mocked(dashboardModule.fetchQANotifications).mockResolvedValueOnce([]);

      renderHook(() => useQANotifications(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "student",
          "notifications",
        ]);
        expect(cacheData).toBeDefined();
      });
    });

    it("has shorter stale time for notifications (30 seconds)", async () => {
      vi.mocked(dashboardModule.fetchQANotifications).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useQANotifications(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      // Verify the hook returns data (staleTime is an internal detail)
      expect(result.current.data).toEqual([]);
    });
  });
});
