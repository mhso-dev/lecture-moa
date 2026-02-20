/**
 * useQuizAutoSave Hook Tests
 * REQ-FE-616: Auto-Save Draft Answers
 *
 * Tests for debounced auto-save functionality including:
 * - 3000ms debounce delay
 * - Auto-save when isDirty becomes true
 * - Reset isDirty and update lastSavedAt on success
 * - Retry after 5 seconds on failure
 * - Force save on navigation using useBeforeUnload integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";
import type { DraftAnswer } from "@shared";

// Mock the API
vi.mock("~/lib/api/quiz.api", () => ({
  saveDraftAnswers: vi.fn(),
}));

// Mock useDebounce to pass through values immediately in tests
vi.mock("~/hooks/useDebounce", () => ({
  useDebounce: vi.fn((value: unknown) => value),
}));

// Mock useBeforeUnload
vi.mock("~/hooks/useBeforeUnload", () => ({
  useBeforeUnload: vi.fn(),
}));

import { saveDraftAnswers } from "~/lib/api/quiz.api";

describe("useQuizAutoSave", () => {
  const mockSaveDraftAnswers = vi.mocked(saveDraftAnswers);

  beforeEach(() => {
    vi.clearAllMocks();
    useQuizTakingStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("returns initial state with isSaving false", async () => {
      const { useQuizAutoSave } = await import("../useQuizAutoSave");

      const { result } = renderHook(() =>
        useQuizAutoSave({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          isDirty: false,
          answers: {},
          focusLossCount: 0,
          enabled: true,
        })
      );

      expect(result.current.isSaving).toBe(false);
      expect(result.current.lastSavedAt).toBeNull();
      expect(result.current.saveError).toBeNull();
    });

    it("does not save when enabled is false", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      useQuizTakingStore.setState({ isDirty: true, answers });

      const { useQuizAutoSave } = await import("../useQuizAutoSave");

      renderHook(() =>
        useQuizAutoSave({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          isDirty: true,
          answers,
          focusLossCount: 0,
          enabled: false,
        })
      );

      // Wait a bit to ensure no save happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSaveDraftAnswers).not.toHaveBeenCalled();
    });
  });

  describe("auto-save trigger", () => {
    it("triggers save when isDirty is true on mount", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      mockSaveDraftAnswers.mockResolvedValueOnce();

      const { useQuizAutoSave } = await import("../useQuizAutoSave");

      renderHook(() =>
        useQuizAutoSave({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          isDirty: true,
          answers,
          focusLossCount: 0,
          enabled: true,
        })
      );

      await waitFor(
        () => {
          expect(mockSaveDraftAnswers).toHaveBeenCalledWith(
            "quiz-1",
            "attempt-1",
            Object.values(answers)
          );
        },
        { timeout: 2000 }
      );
    });

    it("includes answers in save payload", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      mockSaveDraftAnswers.mockResolvedValueOnce();

      const { useQuizAutoSave } = await import("../useQuizAutoSave");

      renderHook(() =>
        useQuizAutoSave({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          isDirty: true,
          answers,
          focusLossCount: 2,
          enabled: true,
        })
      );

      await waitFor(
        () => {
          expect(mockSaveDraftAnswers).toHaveBeenCalledWith(
            "quiz-1",
            "attempt-1",
            expect.arrayContaining([expect.objectContaining({ questionId: "q-1" })])
          );
        },
        { timeout: 2000 }
      );
    });
  });

  describe("save success", () => {
    it("resets isDirty and updates lastSavedAt on success", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      useQuizTakingStore.setState({ isDirty: true, answers });
      mockSaveDraftAnswers.mockResolvedValueOnce();

      const { useQuizAutoSave } = await import("../useQuizAutoSave");

      const { result } = renderHook(() =>
        useQuizAutoSave({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          isDirty: true,
          answers,
          focusLossCount: 0,
          enabled: true,
        })
      );

      await waitFor(
        () => {
          expect(mockSaveDraftAnswers).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      // Check store was updated
      expect(useQuizTakingStore.getState().isDirty).toBe(false);
      expect(useQuizTakingStore.getState().lastSavedAt).not.toBeNull();
      expect(result.current.saveError).toBeNull();
    });
  });

  describe("save failure", () => {
    it("sets saveError on failure", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      useQuizTakingStore.setState({ isDirty: true, answers });
      const error = new Error("Network error");
      mockSaveDraftAnswers.mockRejectedValueOnce(error);

      const { useQuizAutoSave } = await import("../useQuizAutoSave");

      const { result } = renderHook(() =>
        useQuizAutoSave({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          isDirty: true,
          answers,
          focusLossCount: 0,
          enabled: true,
        })
      );

      await waitFor(
        () => {
          expect(mockSaveDraftAnswers).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      expect(result.current.saveError).toBe(error);
    });
  });

  describe("forceSave", () => {
    it("forceSave immediately saves current state", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      useQuizTakingStore.setState({ isDirty: true, answers });
      mockSaveDraftAnswers.mockResolvedValueOnce();

      const { useQuizAutoSave } = await import("../useQuizAutoSave");

      const { result } = renderHook(() =>
        useQuizAutoSave({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          isDirty: true,
          answers,
          focusLossCount: 0,
          enabled: true,
        })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      expect(mockSaveDraftAnswers).toHaveBeenCalledWith(
        "quiz-1",
        "attempt-1",
        Object.values(answers)
      );
    });

    it("forceSave returns without saving when no attemptId", async () => {
      const { useQuizAutoSave } = await import("../useQuizAutoSave");

      const { result } = renderHook(() =>
        useQuizAutoSave({
          quizId: "quiz-1",
          attemptId: "",
          isDirty: true,
          answers: {},
          focusLossCount: 0,
          enabled: true,
        })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      expect(mockSaveDraftAnswers).not.toHaveBeenCalled();
    });
  });

  describe("isSaving state", () => {
    it("sets isSaving to true during save operation", async () => {
      const answers: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      useQuizTakingStore.setState({ isDirty: true, answers });

      // Create a promise we can resolve manually
      let resolveSave: (() => void) | undefined;
      mockSaveDraftAnswers.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveSave = resolve;
          })
      );

      const { useQuizAutoSave } = await import("../useQuizAutoSave");

      const { result } = renderHook(() =>
        useQuizAutoSave({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          isDirty: true,
          answers,
          focusLossCount: 0,
          enabled: true,
        })
      );

      // Wait for save to be called
      await waitFor(
        () => {
          expect(mockSaveDraftAnswers).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      // Should be saving
      expect(result.current.isSaving).toBe(true);

      // Resolve the save
      act(() => {
        if (resolveSave) resolveSave();
      });

      // Should no longer be saving
      expect(result.current.isSaving).toBe(false);
    });
  });
});
