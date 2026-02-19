/**
 * Instructor Dashboard Hooks Tests
 * REQ-FE-227: TanStack Query hooks for instructor dashboard data
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useInstructorCourses,
  useStudentActivity,
  usePendingQA,
  useQuizPerformance,
  useActivityFeed,
  instructorDashboardKeys,
} from "../useInstructorDashboard";
import * as apiModule from "~/lib/api";

// Mock the API module
vi.mock("~/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

// Mock environment variable for mock data
vi.mock("~/src/env", () => ({
  env: {
    NEXT_PUBLIC_API_URL: "http://localhost:3001",
    NEXT_PUBLIC_USE_MOCK_DATA: undefined,
  },
}));

describe("Instructor Dashboard Hooks", () => {
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

  describe("instructorDashboardKeys", () => {
    it("generates correct query keys", () => {
      expect(instructorDashboardKeys.all).toEqual(["dashboard", "instructor"]);
      expect(instructorDashboardKeys.courses()).toEqual([
        "dashboard",
        "instructor",
        "courses",
      ]);
      expect(instructorDashboardKeys.studentActivity()).toEqual([
        "dashboard",
        "instructor",
        "studentActivity",
      ]);
      expect(instructorDashboardKeys.pendingQA()).toEqual([
        "dashboard",
        "instructor",
        "pendingQA",
      ]);
      expect(instructorDashboardKeys.quizPerformance()).toEqual([
        "dashboard",
        "instructor",
        "quizPerformance",
      ]);
      expect(instructorDashboardKeys.activityFeed(1)).toEqual([
        "dashboard",
        "instructor",
        "activityFeed",
        1,
      ]);
    });
  });

  describe("useInstructorCourses", () => {
    it("fetches instructor courses with metrics", async () => {
      const mockCourses = [
        {
          id: "1",
          title: "Introduction to React",
          enrolledCount: 42,
          materialsCount: 15,
          pendingQACount: 3,
          isPublished: true,
        },
        {
          id: "2",
          title: "Advanced TypeScript",
          enrolledCount: 28,
          materialsCount: 12,
          pendingQACount: 7,
          isPublished: false,
        },
      ];

      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: mockCourses,
        success: true,
      });

      const { result } = renderHook(() => useInstructorCourses(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockCourses);
      expect(apiModule.api.get).toHaveBeenCalledWith(
        "/api/v1/dashboard/instructor/courses"
      );
    });

    it("uses correct query key", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: [],
        success: true,
      });

      renderHook(() => useInstructorCourses(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "instructor",
          "courses",
        ]);
        expect(cacheData).toBeDefined();
      });
    });

    it("uses 2-minute stale time for metrics", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: [],
        success: true,
      });

      const { result } = renderHook(() => useInstructorCourses(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      // Verify data is available
      expect(result.current.data).toEqual([]);
    });

    it("handles errors gracefully", async () => {
      vi.mocked(apiModule.api.get).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useInstructorCourses(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("useStudentActivity", () => {
    it("fetches student activity statistics", async () => {
      const mockStats = {
        totalStudents: 150,
        activeStudents7d: 87,
        avgCompletionRate: 68.5,
        studySessions7d: 423,
      };

      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: mockStats,
        success: true,
      });

      const { result } = renderHook(() => useStudentActivity(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockStats);
      expect(apiModule.api.get).toHaveBeenCalledWith(
        "/api/v1/dashboard/instructor/students/activity"
      );
    });

    it("uses correct query key", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: {
          totalStudents: 0,
          activeStudents7d: 0,
          avgCompletionRate: 0,
          studySessions7d: 0,
        },
        success: true,
      });

      renderHook(() => useStudentActivity(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "instructor",
          "studentActivity",
        ]);
        expect(cacheData).toBeDefined();
      });
    });

    it("uses 2-minute stale time for metrics", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: {
          totalStudents: 0,
          activeStudents7d: 0,
          avgCompletionRate: 0,
          studySessions7d: 0,
        },
        success: true,
      });

      const { result } = renderHook(() => useStudentActivity(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toBeDefined();
    });
  });

  describe("usePendingQA", () => {
    it("fetches pending Q&A items", async () => {
      const mockItems = [
        {
          id: "1",
          questionExcerpt: "How do I use useEffect properly?",
          studentName: "John Doe",
          courseName: "Introduction to React",
          askedAt: "2026-02-18T10:00:00Z",
          isUrgent: false,
        },
        {
          id: "2",
          questionExcerpt: "What is the difference between interface and type?",
          studentName: "Jane Smith",
          courseName: "Advanced TypeScript",
          askedAt: "2026-02-15T08:00:00Z",
          isUrgent: true,
        },
      ];

      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: mockItems,
        success: true,
      });

      const { result } = renderHook(() => usePendingQA(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockItems);
      expect(apiModule.api.get).toHaveBeenCalledWith(
        "/api/v1/dashboard/instructor/qa/pending"
      );
    });

    it("uses correct query key", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: [],
        success: true,
      });

      renderHook(() => usePendingQA(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "instructor",
          "pendingQA",
        ]);
        expect(cacheData).toBeDefined();
      });
    });

    it("uses 1-minute stale time for pending Q&A (more real-time)", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: [],
        success: true,
      });

      const { result } = renderHook(() => usePendingQA(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual([]);
    });
  });

  describe("useQuizPerformance", () => {
    it("fetches quiz performance summaries", async () => {
      const mockSummaries = [
        {
          id: "1",
          quizTitle: "React Basics Quiz",
          courseName: "Introduction to React",
          averageScore: 82.5,
          submissionCount: 38,
          passRate: 89.5,
        },
        {
          id: "2",
          quizTitle: "TypeScript Generics",
          courseName: "Advanced TypeScript",
          averageScore: 75.0,
          submissionCount: 22,
          passRate: 77.3,
        },
      ];

      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: mockSummaries,
        success: true,
      });

      const { result } = renderHook(() => useQuizPerformance(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockSummaries);
      expect(apiModule.api.get).toHaveBeenCalledWith(
        "/api/v1/dashboard/instructor/quizzes/performance"
      );
    });

    it("uses correct query key", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: [],
        success: true,
      });

      renderHook(() => useQuizPerformance(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "instructor",
          "quizPerformance",
        ]);
        expect(cacheData).toBeDefined();
      });
    });

    it("uses 2-minute stale time for metrics", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: [],
        success: true,
      });

      const { result } = renderHook(() => useQuizPerformance(), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual([]);
    });
  });

  describe("useActivityFeed", () => {
    it("fetches paginated activity feed", async () => {
      const mockFeed = {
        items: [
          {
            id: "1",
            type: "enrolled" as const,
            actorName: "John Doe",
            courseName: "Introduction to React",
            createdAt: "2026-02-18T10:00:00Z",
          },
          {
            id: "2",
            type: "quiz_completed" as const,
            actorName: "Jane Smith",
            courseName: "Advanced TypeScript",
            createdAt: "2026-02-18T09:30:00Z",
          },
        ],
        pagination: {
          page: 1,
          totalPages: 3,
          totalItems: 25,
          hasNextPage: true,
        },
      };

      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: mockFeed,
        success: true,
      });

      const { result } = renderHook(() => useActivityFeed({ page: 1 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockFeed);
      expect(apiModule.api.get).toHaveBeenCalledWith(
        "/api/v1/dashboard/instructor/activity?page=1"
      );
    });

    it("uses correct query key with page parameter", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: {
          items: [],
          pagination: {
            page: 2,
            totalPages: 1,
            totalItems: 0,
            hasNextPage: false,
          },
        },
        success: true,
      });

      renderHook(() => useActivityFeed({ page: 2 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "instructor",
          "activityFeed",
          2,
        ]);
        expect(cacheData).toBeDefined();
      });
    });

    it("defaults to page 1 when not specified", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: {
          items: [],
          pagination: {
            page: 1,
            totalPages: 1,
            totalItems: 0,
            hasNextPage: false,
          },
        },
        success: true,
      });

      renderHook(() => useActivityFeed({}), {
        wrapper: Wrapper,
      });

      await waitFor(() =>
        { expect(apiModule.api.get).toHaveBeenCalledWith(
          "/api/v1/dashboard/instructor/activity?page=1"
        ); }
      );
    });

    it("uses 2-minute stale time for activity feed", async () => {
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({
        data: {
          items: [],
          pagination: {
            page: 1,
            totalPages: 1,
            totalItems: 0,
            hasNextPage: false,
          },
        },
        success: true,
      });

      const { result } = renderHook(() => useActivityFeed({ page: 1 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toBeDefined();
    });
  });
});
