/**
 * useQuizAnswers Hook Tests
 * Answer management for quiz-taking
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";
import type { MultipleChoiceDraftAnswer, TrueFalseDraftAnswer } from "@shared";

describe("useQuizAnswers", () => {
  beforeEach(() => {
    // Reset store to initial state
    useQuizTakingStore.getState().reset();
  });

  describe("getAnswer", () => {
    it("returns undefined when no answer exists", async () => {
      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      const answer = result.current.getAnswer("q-1");
      expect(answer).toBeUndefined();
    });

    it("returns existing answer for question", async () => {
      const existingAnswer: MultipleChoiceDraftAnswer = {
        questionId: "q-1",
        type: "multiple_choice",
        selectedOptionId: "opt-1",
      };

      act(() => {
        useQuizTakingStore.setState({ answers: { "q-1": existingAnswer } });
      });

      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      const answer = result.current.getAnswer("q-1");
      expect(answer).toEqual(existingAnswer);
    });
  });

  describe("setAnswer", () => {
    it("sets multiple choice answer", async () => {
      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      act(() => {
        result.current.setAnswer("q-1", "multiple_choice", { selectedOptionId: "opt-1" });
      });

      const stored = useQuizTakingStore.getState().answers["q-1"];
      expect(stored).toEqual({
        questionId: "q-1",
        type: "multiple_choice",
        selectedOptionId: "opt-1",
      });
    });

    it("sets true/false answer", async () => {
      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      act(() => {
        result.current.setAnswer("q-2", "true_false", { selectedAnswer: true });
      });

      const stored = useQuizTakingStore.getState().answers["q-2"];
      expect(stored).toEqual({
        questionId: "q-2",
        type: "true_false",
        selectedAnswer: true,
      });
    });

    it("sets short answer answer", async () => {
      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      act(() => {
        result.current.setAnswer("q-3", "short_answer", { text: "My answer" });
      });

      const stored = useQuizTakingStore.getState().answers["q-3"];
      expect(stored).toEqual({
        questionId: "q-3",
        type: "short_answer",
        text: "My answer",
      });
    });

    it("sets fill in blank answer", async () => {
      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      act(() => {
        result.current.setAnswer("q-4", "fill_in_the_blank", {
          filledAnswers: { blank1: "answer1", blank2: "answer2" },
        });
      });

      const stored = useQuizTakingStore.getState().answers["q-4"];
      expect(stored).toEqual({
        questionId: "q-4",
        type: "fill_in_the_blank",
        filledAnswers: { blank1: "answer1", blank2: "answer2" },
      });
    });
  });

  describe("clearAnswer", () => {
    it("clears an answer by setting to null value", async () => {
      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      act(() => {
        result.current.clearAnswer("q-1");
      });

      const stored = useQuizTakingStore.getState().answers["q-1"];
      expect(stored).toEqual({
        questionId: "q-1",
        type: "multiple_choice",
        selectedOptionId: null,
      });
    });
  });

  describe("hasAnswer", () => {
    it("returns false when no answer exists", async () => {
      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      expect(result.current.hasAnswer("q-1")).toBe(false);
    });

    it("returns true when answer exists", async () => {
      const existingAnswer: MultipleChoiceDraftAnswer = {
        questionId: "q-1",
        type: "multiple_choice",
        selectedOptionId: "opt-1",
      };

      act(() => {
        useQuizTakingStore.setState({ answers: { "q-1": existingAnswer } });
      });

      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      expect(result.current.hasAnswer("q-1")).toBe(true);
    });

    it("returns false for null selectedOptionId", async () => {
      const existingAnswer: MultipleChoiceDraftAnswer = {
        questionId: "q-1",
        type: "multiple_choice",
        selectedOptionId: null,
      };

      act(() => {
        useQuizTakingStore.setState({ answers: { "q-1": existingAnswer } });
      });

      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      expect(result.current.hasAnswer("q-1")).toBe(false);
    });

    it("returns false for null selectedAnswer in true/false", async () => {
      const existingAnswer: TrueFalseDraftAnswer = {
        questionId: "q-1",
        type: "true_false",
        selectedAnswer: null,
      };

      act(() => {
        useQuizTakingStore.setState({ answers: { "q-1": existingAnswer } });
      });

      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      expect(result.current.hasAnswer("q-1")).toBe(false);
    });

    it("returns true for empty short answer text", async () => {
      act(() => {
        useQuizTakingStore.setState({
          answers: {
            "q-1": { questionId: "q-1", type: "short_answer", text: "" },
          },
        });
      });

      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      // Empty text is still considered an answer
      expect(result.current.hasAnswer("q-1")).toBe(true);
    });
  });

  describe("getAllAnswers", () => {
    it("returns empty array when no answers", async () => {
      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      expect(result.current.getAllAnswers()).toEqual([]);
    });

    it("returns all answers as array", async () => {
      const answer1: MultipleChoiceDraftAnswer = {
        questionId: "q-1",
        type: "multiple_choice",
        selectedOptionId: "opt-1",
      };
      const answer2: TrueFalseDraftAnswer = {
        questionId: "q-2",
        type: "true_false",
        selectedAnswer: true,
      };

      act(() => {
        useQuizTakingStore.setState({ answers: { "q-1": answer1, "q-2": answer2 } });
      });

      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      const allAnswers = result.current.getAllAnswers();
      expect(allAnswers).toHaveLength(2);
      expect(allAnswers).toContainEqual(answer1);
      expect(allAnswers).toContainEqual(answer2);
    });
  });

  describe("getAnsweredCount", () => {
    it("returns 0 when no answers", async () => {
      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      expect(result.current.getAnsweredCount()).toBe(0);
    });

    it("returns count of answered questions", async () => {
      act(() => {
        useQuizTakingStore.setState({
          answers: {
            "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
            "q-2": { questionId: "q-2", type: "true_false", selectedAnswer: true },
            "q-3": { questionId: "q-3", type: "multiple_choice", selectedOptionId: null },
          },
        });
      });

      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      // Only q-1 and q-2 have actual answers (q-3 has null)
      expect(result.current.getAnsweredCount()).toBe(2);
    });
  });

  describe("isDirty", () => {
    it("returns isDirty from store", async () => {
      act(() => {
        useQuizTakingStore.setState({ isDirty: true });
      });

      const { useQuizAnswers } = await import("../useQuizAnswers");
      const { result } = renderHook(() => useQuizAnswers());

      expect(result.current.isDirty).toBe(true);
    });
  });
});
