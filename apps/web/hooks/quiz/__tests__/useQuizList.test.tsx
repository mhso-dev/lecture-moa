/**
 * useQuizList Hook Tests
 * REQ-FE-602: Quiz list fetching with pagination
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import * as quizApi from "~/lib/supabase/quizzes";

// Mock the API module
vi.mock("~/lib/supabase/quizzes", () => ({
  getQuizzes: vi.fn(),
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

describe("useQuizList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query key", () => {
    it("uses ['quizzes'] as base key when no params", async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      vi.mocked(quizApi.getQuizzes).mockResolvedValue(mockData);

      const { useQuizList } = await import("../useQuizList");
      const { result } = renderHook(() => useQuizList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getQuizzes).toHaveBeenCalledWith(undefined);
    });

    it("uses ['quizzes', params] when params provided", async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      vi.mocked(quizApi.getQuizzes).mockResolvedValue(mockData);

      const params = { status: "published" as const, courseId: "course-1" };
      const { useQuizList } = await import("../useQuizList");
      const { result } = renderHook(() => useQuizList(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getQuizzes).toHaveBeenCalledWith(params);
    });
  });

  describe("data fetching", () => {
    it("returns quiz list data on success", async () => {
      const mockData = {
        data: [
          {
            id: "quiz-1",
            title: "Quiz 1",
            courseId: "course-1",
            courseName: "Course 1",
            status: "published" as const,
            questionCount: 10,
            timeLimitMinutes: 30,
            passingScore: 70,
            dueDate: null,
            attemptCount: 5,
            myLastAttemptScore: 80,
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      vi.mocked(quizApi.getQuizzes).mockResolvedValue(mockData);

      const { useQuizList } = await import("../useQuizList");
      const { result } = renderHook(() => useQuizList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockData);
    });

    it("handles empty list", async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      vi.mocked(quizApi.getQuizzes).mockResolvedValue(mockData);

      const { useQuizList } = await import("../useQuizList");
      const { result } = renderHook(() => useQuizList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data?.data).toEqual([]);
    });

    it("handles API error", async () => {
      vi.mocked(quizApi.getQuizzes).mockRejectedValue(new Error("API Error"));

      const { useQuizList } = await import("../useQuizList");
      const { result } = renderHook(() => useQuizList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("API Error");
    });
  });

  describe("filtering", () => {
    it("filters by status", async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      vi.mocked(quizApi.getQuizzes).mockResolvedValue(mockData);

      const { useQuizList } = await import("../useQuizList");
      const { result } = renderHook(
        () => useQuizList({ status: "closed" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getQuizzes).toHaveBeenCalledWith({ status: "closed" });
    });

    it("filters by courseId", async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      vi.mocked(quizApi.getQuizzes).mockResolvedValue(mockData);

      const { useQuizList } = await import("../useQuizList");
      const { result } = renderHook(
        () => useQuizList({ courseId: "course-123" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getQuizzes).toHaveBeenCalledWith({ courseId: "course-123" });
    });

    it("filters by both status and courseId", async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      vi.mocked(quizApi.getQuizzes).mockResolvedValue(mockData);

      const { useQuizList } = await import("../useQuizList");
      const { result } = renderHook(
        () => useQuizList({ status: "published", courseId: "course-123" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getQuizzes).toHaveBeenCalledWith({
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
      vi.mocked(quizApi.getQuizzes).mockResolvedValue(mockData);

      const { useQuizList } = await import("../useQuizList");
      const { result } = renderHook(
        () => useQuizList({ cursor: "current-cursor" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getQuizzes).toHaveBeenCalledWith({ cursor: "current-cursor" });
    });
  });
});
