/**
 * useQuizSubmission Hook Tests
 * REQ-FE-617: Quiz Submission
 *
 * Tests for quiz submission orchestration including:
 * - Calculate unanswered count
 * - Show confirmation dialog before submit
 * - Force save before submission
 * - POST to submit endpoint
 * - Navigate to results on success
 * - Reset store after submission
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";
import type { DraftAnswer, Question } from "@shared";

// Mock the API
vi.mock("~/lib/api/quiz.api", () => ({
  submitQuizAttempt: vi.fn(),
  saveDraftAnswers: vi.fn(),
}));

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

import { submitQuizAttempt, saveDraftAnswers } from "~/lib/api/quiz.api";
import { useQuizSubmission } from "../useQuizSubmission";
import type { QuizModuleResult } from "@shared";

describe("useQuizSubmission", () => {
  const mockSubmitQuizAttempt = vi.mocked(submitQuizAttempt);
  const mockSaveDraftAnswers = vi.mocked(saveDraftAnswers);

  const mockQuestions: Question[] = [
    {
      id: "q-1",
      quizId: "quiz-1",
      order: 0,
      questionText: "Question 1",
      points: 10,
      explanation: null,
      type: "multiple_choice",
      options: [
        { id: "opt-1", text: "Option 1" },
        { id: "opt-2", text: "Option 2" },
      ],
      correctOptionId: "opt-1",
    },
    {
      id: "q-2",
      quizId: "quiz-1",
      order: 1,
      questionText: "Question 2",
      points: 10,
      explanation: null,
      type: "true_false",
      correctAnswer: true,
    },
    {
      id: "q-3",
      quizId: "quiz-1",
      order: 2,
      questionText: "Question 3",
      points: 10,
      explanation: null,
      type: "short_answer",
      sampleAnswer: "Sample",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useQuizTakingStore.getState().reset();
  });

  describe("unansweredCount", () => {
    it("returns 0 when all questions are answered", () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
        "q-2": { questionId: "q-2", type: "true_false", selectedAnswer: true },
        "q-3": { questionId: "q-3", type: "short_answer", text: "My answer" },
      };

      useQuizTakingStore.setState({ answers, questions: mockQuestions });

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 3,
        })
      );

      expect(result.current.unansweredCount).toBe(0);
    });

    it("returns correct count for unanswered questions", () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
        // q-2 and q-3 not answered
      };

      useQuizTakingStore.setState({ answers, questions: mockQuestions });

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 3,
        })
      );

      expect(result.current.unansweredCount).toBe(2);
    });

    it("counts null answers as unanswered", () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: null },
        "q-2": { questionId: "q-2", type: "true_false", selectedAnswer: null },
      };

      useQuizTakingStore.setState({ answers, questions: mockQuestions });

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 3,
        })
      );

      expect(result.current.unansweredCount).toBe(3); // 2 null + 1 missing
    });
  });

  describe("confirmation dialog", () => {
    it("starts with dialog closed", () => {
      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers: {},
          totalQuestions: 3,
        })
      );

      expect(result.current.showConfirmDialog).toBe(false);
    });

    it("opens dialog on openConfirmDialog", () => {
      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers: {},
          totalQuestions: 3,
        })
      );

      act(() => {
        result.current.openConfirmDialog();
      });

      expect(result.current.showConfirmDialog).toBe(true);
    });

    it("closes dialog on closeConfirmDialog", () => {
      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers: {},
          totalQuestions: 3,
        })
      );

      act(() => {
        result.current.openConfirmDialog();
      });

      expect(result.current.showConfirmDialog).toBe(true);

      act(() => {
        result.current.closeConfirmDialog();
      });

      expect(result.current.showConfirmDialog).toBe(false);
    });
  });

  describe("confirmSubmit", () => {
    it("forces save before submission", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      const mockResult: QuizModuleResult = {
        attemptId: "attempt-1",
        quizId: "quiz-1",
        quizTitle: "Test Quiz",
        score: 10,
        maxScore: 30,
        percentage: 33,
        passed: false,
        timeTaken: 300,
        questionResults: [],
      };

      mockSaveDraftAnswers.mockResolvedValueOnce();
      mockSubmitQuizAttempt.mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 1,
        })
      );

      await act(async () => {
        await result.current.confirmSubmit();
      });

      expect(mockSaveDraftAnswers).toHaveBeenCalledWith(
        "quiz-1",
        "attempt-1",
        Object.values(answers)
      );
    });

    it("submits quiz and returns result", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      const mockResult: QuizModuleResult = {
        attemptId: "attempt-1",
        quizId: "quiz-1",
        quizTitle: "Test Quiz",
        score: 10,
        maxScore: 10,
        percentage: 100,
        passed: true,
        timeTaken: 300,
        questionResults: [],
      };

      mockSaveDraftAnswers.mockResolvedValueOnce();
      mockSubmitQuizAttempt.mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 1,
        })
      );

      let submitResult: QuizModuleResult | null = null;

      await act(async () => {
        submitResult = await result.current.confirmSubmit();
      });

      expect(mockSubmitQuizAttempt).toHaveBeenCalledWith("quiz-1", "attempt-1");
      expect(submitResult).toEqual(mockResult);
    });

    it("navigates to results page on success", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      const mockResult: QuizModuleResult = {
        attemptId: "attempt-1",
        quizId: "quiz-1",
        quizTitle: "Test Quiz",
        score: 10,
        maxScore: 10,
        percentage: 100,
        passed: true,
        timeTaken: 300,
        questionResults: [],
      };

      mockSaveDraftAnswers.mockResolvedValueOnce();
      mockSubmitQuizAttempt.mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 1,
        })
      );

      await act(async () => {
        await result.current.confirmSubmit();
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/quizzes/quiz-1/results?attemptId=attempt-1"
      );
    });

    it("resets store after successful submission", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      const mockResult: QuizModuleResult = {
        attemptId: "attempt-1",
        quizId: "quiz-1",
        quizTitle: "Test Quiz",
        score: 10,
        maxScore: 10,
        percentage: 100,
        passed: true,
        timeTaken: 300,
        questionResults: [],
      };

      mockSaveDraftAnswers.mockResolvedValueOnce();
      mockSubmitQuizAttempt.mockResolvedValueOnce(mockResult);

      useQuizTakingStore.setState({
        quizId: "quiz-1",
        attemptId: "attempt-1",
        answers,
        isDirty: true,
      });

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 1,
        })
      );

      await act(async () => {
        await result.current.confirmSubmit();
      });

      const storeState = useQuizTakingStore.getState();
      expect(storeState.quizId).toBeNull();
      expect(storeState.attemptId).toBeNull();
      expect(storeState.answers).toEqual({});
    });

    it("sets submitError on failure", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      const error = new Error("Submission failed");
      mockSaveDraftAnswers.mockResolvedValueOnce();
      mockSubmitQuizAttempt.mockRejectedValueOnce(error);

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 1,
        })
      );

      await act(async () => {
        await result.current.confirmSubmit();
      });

      expect(result.current.submitError).toEqual(error);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("returns null when no attemptId", async () => {
      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "",
          answers: {},
          totalQuestions: 1,
        })
      );

      let submitResult: QuizModuleResult | null = undefined as unknown as QuizModuleResult | null;

      await act(async () => {
        submitResult = await result.current.confirmSubmit();
      });

      expect(submitResult).toBeNull();
      expect(mockSubmitQuizAttempt).not.toHaveBeenCalled();
    });

    it("closes dialog after successful submission", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      const mockResult: QuizModuleResult = {
        attemptId: "attempt-1",
        quizId: "quiz-1",
        quizTitle: "Test Quiz",
        score: 10,
        maxScore: 10,
        percentage: 100,
        passed: true,
        timeTaken: 300,
        questionResults: [],
      };

      mockSaveDraftAnswers.mockResolvedValueOnce();
      mockSubmitQuizAttempt.mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 1,
        })
      );

      act(() => {
        result.current.openConfirmDialog();
      });

      expect(result.current.showConfirmDialog).toBe(true);

      await act(async () => {
        await result.current.confirmSubmit();
      });

      expect(result.current.showConfirmDialog).toBe(false);
    });

    it("keeps dialog open on failure", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      mockSaveDraftAnswers.mockResolvedValueOnce();
      mockSubmitQuizAttempt.mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 1,
        })
      );

      act(() => {
        result.current.openConfirmDialog();
      });

      await act(async () => {
        await result.current.confirmSubmit();
      });

      expect(result.current.showConfirmDialog).toBe(true);
    });
  });

  describe("isSubmitting state", () => {
    it("shows isSubmitting true during submission", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      const mockResult: QuizModuleResult = {
        attemptId: "attempt-1",
        quizId: "quiz-1",
        quizTitle: "Test Quiz",
        score: 10,
        maxScore: 10,
        percentage: 100,
        passed: true,
        timeTaken: 300,
        questionResults: [],
      };

      let resolveSubmit: (() => void) | undefined;
      mockSaveDraftAnswers.mockResolvedValueOnce();
      mockSubmitQuizAttempt.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmit = () => {
              resolve(mockResult);
            };
          })
      );

      const { result } = renderHook(() =>
        useQuizSubmission({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          answers,
          totalQuestions: 1,
        })
      );

      // Start submission (don't await yet)
      let submitPromise: Promise<QuizModuleResult | null> | undefined;
      act(() => {
        submitPromise = result.current.confirmSubmit();
      });

      // Wait for isSubmitting to become true
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      // Resolve the submit
      await act(async () => {
        if (resolveSubmit) resolveSubmit();
        if (submitPromise) await submitPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
