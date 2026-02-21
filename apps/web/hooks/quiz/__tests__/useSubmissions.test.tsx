/**
 * useSubmissions Hook Tests
 * Quiz submissions fetching for instructor view
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import * as quizApi from "~/lib/supabase/quizzes";

// Mock the API module
vi.mock("~/lib/supabase/quizzes", () => ({
  getSubmissions: vi.fn(),
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

const createMockSubmission = (userId: string) => ({
  userId,
  userName: `Student ${userId}`,
  attemptId: `attempt-${userId}`,
  score: 80,
  percentage: 80,
  passed: true,
  submittedAt: "2024-01-01T12:00:00Z",
});

describe("useSubmissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query key", () => {
    it("uses ['instructor', 'quizzes', quizId, 'submissions'] as key", async () => {
      const mockData = [createMockSubmission("user-1")];
      vi.mocked(quizApi.getSubmissions).mockResolvedValue(mockData);

      const { useSubmissions } = await import("../useSubmissions");
      const { result } = renderHook(() => useSubmissions("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getSubmissions).toHaveBeenCalledWith("quiz-1");
    });
  });

  describe("enabled option", () => {
    it("is disabled when quizId is empty", async () => {
      const { useSubmissions } = await import("../useSubmissions");
      renderHook(() => useSubmissions(""), {
        wrapper: createWrapper(),
      });

      expect(quizApi.getSubmissions).not.toHaveBeenCalled();
    });

    it("is disabled when quizId is undefined", async () => {
      const { useSubmissions } = await import("../useSubmissions");
      renderHook(() => useSubmissions(undefined as unknown as string), {
        wrapper: createWrapper(),
      });

      expect(quizApi.getSubmissions).not.toHaveBeenCalled();
    });

    it("is enabled when quizId is valid", async () => {
      const mockData = [createMockSubmission("user-1")];
      vi.mocked(quizApi.getSubmissions).mockResolvedValue(mockData);

      const { useSubmissions } = await import("../useSubmissions");
      const { result } = renderHook(() => useSubmissions("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getSubmissions).toHaveBeenCalledWith("quiz-1");
    });
  });

  describe("data fetching", () => {
    it("returns submissions list on success", async () => {
      const mockData = [
        createMockSubmission("user-1"),
        createMockSubmission("user-2"),
        createMockSubmission("user-3"),
      ];
      vi.mocked(quizApi.getSubmissions).mockResolvedValue(mockData);

      const { useSubmissions } = await import("../useSubmissions");
      const { result } = renderHook(() => useSubmissions("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.data).toHaveLength(3);
    });

    it("handles empty submissions list", async () => {
      vi.mocked(quizApi.getSubmissions).mockResolvedValue([]);

      const { useSubmissions } = await import("../useSubmissions");
      const { result } = renderHook(() => useSubmissions("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual([]);
    });

    it("handles API error", async () => {
      vi.mocked(quizApi.getSubmissions).mockRejectedValue(
        new Error("API Error")
      );

      const { useSubmissions } = await import("../useSubmissions");
      const { result } = renderHook(() => useSubmissions("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("submission data", () => {
    it("includes user information in submissions", async () => {
      const mockData = [createMockSubmission("user-1")];
      vi.mocked(quizApi.getSubmissions).mockResolvedValue(mockData);

      const { useSubmissions } = await import("../useSubmissions");
      const { result } = renderHook(() => useSubmissions("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      const submission = result.current.data?.[0];
      expect(submission?.userId).toBe("user-1");
      expect(submission?.userName).toBe("Student user-1");
    });

    it("includes score and pass status in submissions", async () => {
      const mockData = [createMockSubmission("user-1")];
      vi.mocked(quizApi.getSubmissions).mockResolvedValue(mockData);

      const { useSubmissions } = await import("../useSubmissions");
      const { result } = renderHook(() => useSubmissions("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      const submission = result.current.data?.[0];
      expect(submission?.score).toBe(80);
      expect(submission?.percentage).toBe(80);
      expect(submission?.passed).toBe(true);
    });

    it("includes submission timestamp", async () => {
      const mockData = [createMockSubmission("user-1")];
      vi.mocked(quizApi.getSubmissions).mockResolvedValue(mockData);

      const { useSubmissions } = await import("../useSubmissions");
      const { result } = renderHook(() => useSubmissions("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      const submission = result.current.data?.[0];
      expect(submission?.submittedAt).toBe("2024-01-01T12:00:00Z");
    });

    it("includes failed submissions", async () => {
      const mockData = [
        { ...createMockSubmission("user-1"), passed: false, score: 50, percentage: 50 },
      ];
      vi.mocked(quizApi.getSubmissions).mockResolvedValue(mockData);

      const { useSubmissions } = await import("../useSubmissions");
      const { result } = renderHook(() => useSubmissions("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      const submission = result.current.data?.[0];
      expect(submission?.passed).toBe(false);
    });
  });
});
