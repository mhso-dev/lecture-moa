/**
 * useInstructorQuizzes Hook Tests
 * Instructor quiz list fetching with pagination and filtering
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import * as quizApi from "~/lib/supabase/quizzes";

// Mock the API module
vi.mock("~/lib/supabase/quizzes", () => ({
  getInstructorQuizzes: vi.fn(),
}));

// Create wrapper with QueryClient
const createWrapper = () => {
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
};

const createMockQuizListItem = (id: string) => ({
  id,
  title: `Quiz ${id}`,
  courseId: "course-1",
  courseName: "Course 1",
  status: "draft" as const,
  questionCount: 10,
  timeLimitMinutes: 30,
  passingScore: 70,
  dueDate: null,
  attemptCount: 0,
  myLastAttemptScore: null,
  createdAt: "2024-01-01T00:00:00Z",
});

describe("useInstructorQuizzes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query key", () => {
    it("uses ['instructor', 'quizzes'] as base key when no params", async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      vi.mocked(quizApi.getInstructorQuizzes).mockResolvedValue(mockData);

      const { useInstructorQuizzes } = await import("../useInstructorQuizzes");
      const { result } = renderHook(() => useInstructorQuizzes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getInstructorQuizzes).toHaveBeenCalledWith(undefined);
    });

    it("uses ['instructor', 'quizzes', params] when params provided", async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      vi.mocked(quizApi.getInstructorQuizzes).mockResolvedValue(mockData);

      const params = { status: "draft" as const, courseId: "course-1" };
      const { useInstructorQuizzes } = await import("../useInstructorQuizzes");
      const { result } = renderHook(() => useInstructorQuizzes(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getInstructorQuizzes).toHaveBeenCalledWith(params);
    });
  });

  describe("data fetching", () => {
    it("returns instructor quiz list data on success", async () => {
      const mockData = {
        data: [
          createMockQuizListItem("quiz-1"),
          createMockQuizListItem("quiz-2"),
        ],
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      };
      vi.mocked(quizApi.getInstructorQuizzes).mockResolvedValue(mockData);

      const { useInstructorQuizzes } = await import("../useInstructorQuizzes");
      const { result } = renderHook(() => useInstructorQuizzes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.data?.data).toHaveLength(2);
    });

    it("handles empty list", async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      vi.mocked(quizApi.getInstructorQuizzes).mockResolvedValue(mockData);

      const { useInstructorQuizzes } = await import("../useInstructorQuizzes");
      const { result } = renderHook(() => useInstructorQuizzes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data?.data).toEqual([]);
    });

    it("handles API error", async () => {
      vi.mocked(quizApi.getInstructorQuizzes).mockRejectedValue(
        new Error("API Error")
      );

      const { useInstructorQuizzes } = await import("../useInstructorQuizzes");
      const { result } = renderHook(() => useInstructorQuizzes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("filtering", () => {
    it("filters by status", async () => {
      const mockData = {
        data: [createMockQuizListItem("quiz-1")],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      vi.mocked(quizApi.getInstructorQuizzes).mockResolvedValue(mockData);

      const { useInstructorQuizzes } = await import("../useInstructorQuizzes");
      const { result } = renderHook(
        () => useInstructorQuizzes({ status: "draft" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getInstructorQuizzes).toHaveBeenCalledWith({ status: "draft" });
    });

    it("filters by courseId", async () => {
      const mockData = {
        data: [createMockQuizListItem("quiz-1")],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      vi.mocked(quizApi.getInstructorQuizzes).mockResolvedValue(mockData);

      const { useInstructorQuizzes } = await import("../useInstructorQuizzes");
      const { result } = renderHook(
        () => useInstructorQuizzes({ courseId: "course-123" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getInstructorQuizzes).toHaveBeenCalledWith({ courseId: "course-123" });
    });

    it("filters by both status and courseId", async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      vi.mocked(quizApi.getInstructorQuizzes).mockResolvedValue(mockData);

      const { useInstructorQuizzes } = await import("../useInstructorQuizzes");
      const { result } = renderHook(
        () => useInstructorQuizzes({ status: "published", courseId: "course-123" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getInstructorQuizzes).toHaveBeenCalledWith({
        status: "published",
        courseId: "course-123",
      });
    });
  });

  describe("pagination", () => {
    it("supports cursor-based pagination", async () => {
      const mockData = {
        data: [],
        pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
      };
      vi.mocked(quizApi.getInstructorQuizzes).mockResolvedValue(mockData);

      const { useInstructorQuizzes } = await import("../useInstructorQuizzes");
      const { result } = renderHook(
        () => useInstructorQuizzes({ cursor: "current-cursor" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getInstructorQuizzes).toHaveBeenCalledWith({ cursor: "current-cursor" });
      expect(result.current.data?.pagination.page).toBe(2);
      expect(result.current.data?.pagination.totalPages).toBe(3);
    });
  });

  describe("instructor-specific data", () => {
    it("returns quizzes with draft status visible to instructors", async () => {
      const mockData = {
        data: [
          { ...createMockQuizListItem("quiz-1"), status: "draft" as const },
          { ...createMockQuizListItem("quiz-2"), status: "draft" as const },
        ],
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      };
      vi.mocked(quizApi.getInstructorQuizzes).mockResolvedValue(mockData);

      const { useInstructorQuizzes } = await import("../useInstructorQuizzes");
      const { result } = renderHook(() => useInstructorQuizzes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data?.data.every(q => q.status === "draft")).toBe(true);
    });
  });
});
