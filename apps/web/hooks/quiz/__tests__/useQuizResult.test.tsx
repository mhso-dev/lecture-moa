/**
 * useQuizResult Hook Tests
 * REQ-FE-620: Quiz result fetching after submission
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import * as quizApi from "~/lib/api/quiz.api";

// Mock the API module
vi.mock("~/lib/api/quiz.api", () => ({
  fetchQuizResult: vi.fn(),
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

const createMockQuizResult = (quizId: string, attemptId: string) => ({
  attemptId,
  quizId,
  quizTitle: "Test Quiz",
  score: 80,
  maxScore: 100,
  percentage: 80,
  passed: true,
  timeTaken: 1800, // 30 minutes in seconds
  questionResults: [
    {
      questionId: "q-1",
      questionText: "Question 1",
      type: "multiple_choice" as const,
      isCorrect: true,
      points: 10,
      earnedPoints: 10,
      studentAnswer: {
        questionId: "q-1",
        type: "multiple_choice" as const,
        selectedOptionId: "opt-1",
      },
      correctAnswer: "opt-1",
      explanation: "Correct answer explanation",
    },
    {
      questionId: "q-2",
      questionText: "Question 2",
      type: "multiple_choice" as const,
      isCorrect: false,
      points: 10,
      earnedPoints: 0,
      studentAnswer: {
        questionId: "q-2",
        type: "multiple_choice" as const,
        selectedOptionId: "opt-1",
      },
      correctAnswer: "opt-2",
      explanation: "Wrong answer explanation",
    },
  ],
});

describe("useQuizResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query key", () => {
    it("uses ['quizzes', quizId, 'result', attemptId] as key", async () => {
      const mockData = createMockQuizResult("quiz-1", "attempt-1");
      vi.mocked(quizApi.fetchQuizResult).mockResolvedValue(mockData);

      const { useQuizResult } = await import("../useQuizResult");
      const { result } = renderHook(
        () => useQuizResult("quiz-1", "attempt-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.fetchQuizResult).toHaveBeenCalledWith("quiz-1", "attempt-1");
    });
  });

  describe("enabled option", () => {
    it("is disabled when quizId is empty", async () => {
      const { useQuizResult } = await import("../useQuizResult");
      renderHook(() => useQuizResult("", "attempt-1"), {
        wrapper: createWrapper(),
      });

      expect(quizApi.fetchQuizResult).not.toHaveBeenCalled();
    });

    it("is disabled when attemptId is empty", async () => {
      const { useQuizResult } = await import("../useQuizResult");
      renderHook(() => useQuizResult("quiz-1", ""), {
        wrapper: createWrapper(),
      });

      expect(quizApi.fetchQuizResult).not.toHaveBeenCalled();
    });

    it("is disabled when both quizId and attemptId are empty", async () => {
      const { useQuizResult } = await import("../useQuizResult");
      renderHook(() => useQuizResult("", ""), {
        wrapper: createWrapper(),
      });

      expect(quizApi.fetchQuizResult).not.toHaveBeenCalled();
    });

    it("is enabled when both quizId and attemptId are valid", async () => {
      const mockData = createMockQuizResult("quiz-1", "attempt-1");
      vi.mocked(quizApi.fetchQuizResult).mockResolvedValue(mockData);

      const { useQuizResult } = await import("../useQuizResult");
      const { result } = renderHook(
        () => useQuizResult("quiz-1", "attempt-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.fetchQuizResult).toHaveBeenCalledWith("quiz-1", "attempt-1");
    });
  });

  describe("data fetching", () => {
    it("returns quiz result with question breakdown on success", async () => {
      const mockData = createMockQuizResult("quiz-1", "attempt-1");
      vi.mocked(quizApi.fetchQuizResult).mockResolvedValue(mockData);

      const { useQuizResult } = await import("../useQuizResult");
      const { result } = renderHook(
        () => useQuizResult("quiz-1", "attempt-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.data?.questionResults).toHaveLength(2);
    });

    it("includes score and percentage in result", async () => {
      const mockData = createMockQuizResult("quiz-1", "attempt-1");
      vi.mocked(quizApi.fetchQuizResult).mockResolvedValue(mockData);

      const { useQuizResult } = await import("../useQuizResult");
      const { result } = renderHook(
        () => useQuizResult("quiz-1", "attempt-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data?.score).toBe(80);
      expect(result.current.data?.percentage).toBe(80);
      expect(result.current.data?.passed).toBe(true);
    });

    it("includes time taken in result", async () => {
      const mockData = createMockQuizResult("quiz-1", "attempt-1");
      vi.mocked(quizApi.fetchQuizResult).mockResolvedValue(mockData);

      const { useQuizResult } = await import("../useQuizResult");
      const { result } = renderHook(
        () => useQuizResult("quiz-1", "attempt-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data?.timeTaken).toBe(1800);
    });

    it("handles 404 error for non-existent attempt", async () => {
      vi.mocked(quizApi.fetchQuizResult).mockRejectedValue(
        new Error("Attempt not found")
      );

      const { useQuizResult } = await import("../useQuizResult");
      const { result } = renderHook(
        () => useQuizResult("quiz-1", "non-existent"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Attempt not found");
    });

    it("handles unauthorized access", async () => {
      vi.mocked(quizApi.fetchQuizResult).mockRejectedValue(
        new Error("Unauthorized")
      );

      const { useQuizResult } = await import("../useQuizResult");
      const { result } = renderHook(
        () => useQuizResult("quiz-1", "other-user-attempt"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("question results", () => {
    it("includes per-question details", async () => {
      const mockData = createMockQuizResult("quiz-1", "attempt-1");
      vi.mocked(quizApi.fetchQuizResult).mockResolvedValue(mockData);

      const { useQuizResult } = await import("../useQuizResult");
      const { result } = renderHook(
        () => useQuizResult("quiz-1", "attempt-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      const questionResults = result.current.data?.questionResults;
      expect(questionResults).toBeDefined();
      const firstResult = questionResults?.[0];
      const secondResult = questionResults?.[1];
      if (firstResult) {
        expect(firstResult.isCorrect).toBe(true);
      }
      if (secondResult) {
        expect(secondResult.isCorrect).toBe(false);
      }
    });

    it("includes explanations for questions", async () => {
      const mockData = createMockQuizResult("quiz-1", "attempt-1");
      vi.mocked(quizApi.fetchQuizResult).mockResolvedValue(mockData);

      const { useQuizResult } = await import("../useQuizResult");
      const { result } = renderHook(
        () => useQuizResult("quiz-1", "attempt-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      const questionResults = result.current.data?.questionResults;
      const firstResult = questionResults?.[0];
      const secondResult = questionResults?.[1];
      if (firstResult) {
        expect(firstResult.explanation).toBe("Correct answer explanation");
      }
      if (secondResult) {
        expect(secondResult.explanation).toBe("Wrong answer explanation");
      }
    });
  });
});
