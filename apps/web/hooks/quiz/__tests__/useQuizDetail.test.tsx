/**
 * useQuizDetail Hook Tests
 * REQ-FE-610: Quiz detail fetching with questions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import * as quizApi from "~/lib/supabase/quizzes";

// Mock the API module
vi.mock("~/lib/supabase/quizzes", () => ({
  getQuiz: vi.fn(),
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

const createMockQuizDetail = (id: string) => ({
  id,
  title: `Quiz ${id}`,
  description: "Test quiz",
  courseId: "course-1",
  courseName: "Course 1",
  status: "published" as const,
  timeLimitMinutes: 30,
  passingScore: 70,
  allowReattempt: true,
  shuffleQuestions: false,
  showAnswersAfterSubmit: true,
  focusLossWarning: true,
  dueDate: null,
  questions: [
    {
      id: "q-1",
      quizId: id,
      order: 1,
      questionText: "Question 1",
      points: 10,
      explanation: null,
      type: "multiple_choice" as const,
      options: [
        { id: "opt-1", text: "Option 1" },
        { id: "opt-2", text: "Option 2" },
      ],
      correctOptionId: "opt-1",
    },
  ],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
});

describe("useQuizDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query key", () => {
    it("uses ['quizzes', quizId] as key", async () => {
      const mockData = createMockQuizDetail("quiz-1");
      vi.mocked(quizApi.getQuiz).mockResolvedValue(mockData);

      const { useQuizDetail } = await import("../useQuizDetail");
      const { result } = renderHook(() => useQuizDetail("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getQuiz).toHaveBeenCalledWith("quiz-1");
    });
  });

  describe("enabled option", () => {
    it("is disabled when quizId is empty string", async () => {
      const { useQuizDetail } = await import("../useQuizDetail");
      renderHook(() => useQuizDetail(""), {
        wrapper: createWrapper(),
      });

      // Should not call API when disabled
      expect(quizApi.getQuiz).not.toHaveBeenCalled();
    });

    it("is disabled when quizId is undefined", async () => {
      const { useQuizDetail } = await import("../useQuizDetail");
      renderHook(() => useQuizDetail(undefined as unknown as string), {
        wrapper: createWrapper(),
      });

      // Should not call API when disabled
      expect(quizApi.getQuiz).not.toHaveBeenCalled();
    });

    it("is enabled when quizId is valid", async () => {
      const mockData = createMockQuizDetail("quiz-1");
      vi.mocked(quizApi.getQuiz).mockResolvedValue(mockData);

      const { useQuizDetail } = await import("../useQuizDetail");
      const { result } = renderHook(() => useQuizDetail("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.getQuiz).toHaveBeenCalledWith("quiz-1");
    });
  });

  describe("data fetching", () => {
    it("returns quiz detail with questions on success", async () => {
      const mockData = createMockQuizDetail("quiz-1");
      vi.mocked(quizApi.getQuiz).mockResolvedValue(mockData);

      const { useQuizDetail } = await import("../useQuizDetail");
      const { result } = renderHook(() => useQuizDetail("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.data?.questions).toHaveLength(1);
    });

    it("handles 404 error", async () => {
      vi.mocked(quizApi.getQuiz).mockRejectedValue(
        new Error("Quiz not found")
      );

      const { useQuizDetail } = await import("../useQuizDetail");
      const { result } = renderHook(() => useQuizDetail("non-existent"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Quiz not found");
    });

    it("handles network error", async () => {
      vi.mocked(quizApi.getQuiz).mockRejectedValue(
        new Error("Network error")
      );

      const { useQuizDetail } = await import("../useQuizDetail");
      const { result } = renderHook(() => useQuizDetail("quiz-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("loading state", () => {
    it("returns isLoading true while fetching", async () => {
      let resolveFn: ((value: ReturnType<typeof createMockQuizDetail>) => void) | undefined;
      vi.mocked(quizApi.getQuiz).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFn = resolve;
          })
      );

      const { useQuizDetail } = await import("../useQuizDetail");
      const { result } = renderHook(() => useQuizDetail("quiz-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      if (resolveFn) {
        resolveFn(createMockQuizDetail("quiz-1"));
      }

      await waitFor(() => { expect(result.current.isLoading).toBe(false); });
    });
  });
});
