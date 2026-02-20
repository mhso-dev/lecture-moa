/**
 * Quiz Taking Store Tests
 * REQ-FE-611: Zustand store for quiz-taking state management
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "@testing-library/react";
import type { Question, MultipleChoiceDraftAnswer } from "@shared";

// Create mock questions for testing
const createMockQuestion = (id: string, order: number): Question => ({
  id,
  quizId: "quiz-1",
  order,
  questionText: `Question ${String(order)}`,
  points: 10,
  explanation: null,
  type: "multiple_choice",
  options: [
    { id: "opt-1", text: "Option 1" },
    { id: "opt-2", text: "Option 2" },
  ],
  correctOptionId: "opt-1",
});

const mockQuestions: Question[] = [
  createMockQuestion("q-1", 1),
  createMockQuestion("q-2", 2),
  createMockQuestion("q-3", 3),
];

const createMockAnswer = (questionId: string, optionId: string): MultipleChoiceDraftAnswer => ({
  questionId,
  type: "multiple_choice",
  selectedOptionId: optionId,
});

describe("QuizTakingStore", () => {
  // Store will be imported after it's created
  let useQuizTakingStore: typeof import("../quiz-taking.store").useQuizTakingStore;

  beforeEach(async () => {
    // Reset modules to get fresh store
    vi.resetModules();
    // Import fresh store
    useQuizTakingStore = (await import("../quiz-taking.store")).useQuizTakingStore;
    // Reset to initial state
    useQuizTakingStore.getState().reset();
  });

  describe("initial state", () => {
    it("has null quizId", () => {
      const { quizId } = useQuizTakingStore.getState();
      expect(quizId).toBeNull();
    });

    it("has null attemptId", () => {
      const { attemptId } = useQuizTakingStore.getState();
      expect(attemptId).toBeNull();
    });

    it("has empty questions array", () => {
      const { questions } = useQuizTakingStore.getState();
      expect(questions).toEqual([]);
    });

    it("has currentQuestionIndex as 0", () => {
      const { currentQuestionIndex } = useQuizTakingStore.getState();
      expect(currentQuestionIndex).toBe(0);
    });

    it("has empty answers record", () => {
      const { answers } = useQuizTakingStore.getState();
      expect(answers).toEqual({});
    });

    it("has null remainingSeconds", () => {
      const { remainingSeconds } = useQuizTakingStore.getState();
      expect(remainingSeconds).toBeNull();
    });

    it("has timerStatus as 'idle'", () => {
      const { timerStatus } = useQuizTakingStore.getState();
      expect(timerStatus).toBe("idle");
    });

    it("has focusLossCount as 0", () => {
      const { focusLossCount } = useQuizTakingStore.getState();
      expect(focusLossCount).toBe(0);
    });

    it("has isDirty as false", () => {
      const { isDirty } = useQuizTakingStore.getState();
      expect(isDirty).toBe(false);
    });

    it("has null lastSavedAt", () => {
      const { lastSavedAt } = useQuizTakingStore.getState();
      expect(lastSavedAt).toBeNull();
    });
  });

  describe("setAnswer action", () => {
    it("sets answer for a question", () => {
      const answer = createMockAnswer("q-1", "opt-1");

      act(() => {
        useQuizTakingStore.getState().setAnswer("q-1", answer);
      });

      expect(useQuizTakingStore.getState().answers["q-1"]).toEqual(answer);
    });

    it("overwrites existing answer", () => {
      const answer1 = createMockAnswer("q-1", "opt-1");
      const answer2 = createMockAnswer("q-1", "opt-2");

      act(() => {
        useQuizTakingStore.getState().setAnswer("q-1", answer1);
      });

      act(() => {
        useQuizTakingStore.getState().setAnswer("q-1", answer2);
      });

      expect(useQuizTakingStore.getState().answers["q-1"]).toEqual(answer2);
    });

    it("sets isDirty to true", () => {
      const answer = createMockAnswer("q-1", "opt-1");

      act(() => {
        useQuizTakingStore.getState().setAnswer("q-1", answer);
      });

      expect(useQuizTakingStore.getState().isDirty).toBe(true);
    });

    it("handles multiple answers for different questions", () => {
      const answer1 = createMockAnswer("q-1", "opt-1");
      const answer2 = createMockAnswer("q-2", "opt-2");

      act(() => {
        useQuizTakingStore.getState().setAnswer("q-1", answer1);
        useQuizTakingStore.getState().setAnswer("q-2", answer2);
      });

      expect(useQuizTakingStore.getState().answers["q-1"]).toEqual(answer1);
      expect(useQuizTakingStore.getState().answers["q-2"]).toEqual(answer2);
    });
  });

  describe("navigateToQuestion action", () => {
    it("sets currentQuestionIndex to valid index", () => {
      // First set questions
      act(() => {
        useQuizTakingStore.setState({ questions: mockQuestions });
      });

      act(() => {
        useQuizTakingStore.getState().navigateToQuestion(1);
      });

      expect(useQuizTakingStore.getState().currentQuestionIndex).toBe(1);
    });

    it("sets currentQuestionIndex to 0", () => {
      act(() => {
        useQuizTakingStore.setState({ questions: mockQuestions, currentQuestionIndex: 2 });
      });

      act(() => {
        useQuizTakingStore.getState().navigateToQuestion(0);
      });

      expect(useQuizTakingStore.getState().currentQuestionIndex).toBe(0);
    });

    it("sets currentQuestionIndex to last question", () => {
      act(() => {
        useQuizTakingStore.setState({ questions: mockQuestions });
      });

      act(() => {
        useQuizTakingStore.getState().navigateToQuestion(2);
      });

      expect(useQuizTakingStore.getState().currentQuestionIndex).toBe(2);
    });
  });

  describe("markSaved action", () => {
    it("sets isDirty to false", () => {
      // First make it dirty
      act(() => {
        useQuizTakingStore.setState({ isDirty: true });
      });

      act(() => {
        useQuizTakingStore.getState().markSaved();
      });

      expect(useQuizTakingStore.getState().isDirty).toBe(false);
    });

    it("updates lastSavedAt to current time", () => {
      const beforeMark = new Date();

      act(() => {
        useQuizTakingStore.getState().markSaved();
      });

      const afterMark = new Date();
      const { lastSavedAt } = useQuizTakingStore.getState();

      expect(lastSavedAt).not.toBeNull();
      expect(lastSavedAt?.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime());
      expect(lastSavedAt?.getTime()).toBeLessThanOrEqual(afterMark.getTime());
    });
  });

  describe("tickTimer action", () => {
    it("decrements remainingSeconds by 1 when running", () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 300,
          timerStatus: "running",
        });
      });

      act(() => {
        useQuizTakingStore.getState().tickTimer();
      });

      expect(useQuizTakingStore.getState().remainingSeconds).toBe(299);
    });

    it("does not decrement when timer is paused", () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 300,
          timerStatus: "paused",
        });
      });

      act(() => {
        useQuizTakingStore.getState().tickTimer();
      });

      expect(useQuizTakingStore.getState().remainingSeconds).toBe(300);
    });

    it("does not decrement when timer is idle", () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 300,
          timerStatus: "idle",
        });
      });

      act(() => {
        useQuizTakingStore.getState().tickTimer();
      });

      expect(useQuizTakingStore.getState().remainingSeconds).toBe(300);
    });

    it("sets timerStatus to expired when reaching 0", () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 1,
          timerStatus: "running",
        });
      });

      act(() => {
        useQuizTakingStore.getState().tickTimer();
      });

      expect(useQuizTakingStore.getState().remainingSeconds).toBe(0);
      expect(useQuizTakingStore.getState().timerStatus).toBe("expired");
    });

    it("does not go below 0", () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 0,
          timerStatus: "expired",
        });
      });

      act(() => {
        useQuizTakingStore.getState().tickTimer();
      });

      expect(useQuizTakingStore.getState().remainingSeconds).toBe(0);
    });
  });

  describe("pauseTimer action", () => {
    it("sets timerStatus to paused when running", () => {
      act(() => {
        useQuizTakingStore.setState({ timerStatus: "running", remainingSeconds: 300 });
      });

      act(() => {
        useQuizTakingStore.getState().pauseTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("paused");
    });

    it("does not change status when idle", () => {
      act(() => {
        useQuizTakingStore.setState({ timerStatus: "idle" });
      });

      act(() => {
        useQuizTakingStore.getState().pauseTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("idle");
    });

    it("does not change status when already paused", () => {
      act(() => {
        useQuizTakingStore.setState({ timerStatus: "paused" });
      });

      act(() => {
        useQuizTakingStore.getState().pauseTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("paused");
    });

    it("does not change status when expired", () => {
      act(() => {
        useQuizTakingStore.setState({ timerStatus: "expired" });
      });

      act(() => {
        useQuizTakingStore.getState().pauseTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("expired");
    });
  });

  describe("resumeTimer action", () => {
    it("sets timerStatus to running when paused", () => {
      act(() => {
        useQuizTakingStore.setState({ timerStatus: "paused", remainingSeconds: 300 });
      });

      act(() => {
        useQuizTakingStore.getState().resumeTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("running");
    });

    it("does not change status when idle", () => {
      act(() => {
        useQuizTakingStore.setState({ timerStatus: "idle" });
      });

      act(() => {
        useQuizTakingStore.getState().resumeTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("idle");
    });

    it("does not change status when already running", () => {
      act(() => {
        useQuizTakingStore.setState({ timerStatus: "running" });
      });

      act(() => {
        useQuizTakingStore.getState().resumeTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("running");
    });

    it("does not change status when expired", () => {
      act(() => {
        useQuizTakingStore.setState({ timerStatus: "expired" });
      });

      act(() => {
        useQuizTakingStore.getState().resumeTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("expired");
    });
  });

  describe("incrementFocusLoss action", () => {
    it("increments focusLossCount from 0 to 1", () => {
      act(() => {
        useQuizTakingStore.getState().incrementFocusLoss();
      });

      expect(useQuizTakingStore.getState().focusLossCount).toBe(1);
    });

    it("increments focusLossCount from 1 to 2", () => {
      act(() => {
        useQuizTakingStore.setState({ focusLossCount: 1 });
      });

      act(() => {
        useQuizTakingStore.getState().incrementFocusLoss();
      });

      expect(useQuizTakingStore.getState().focusLossCount).toBe(2);
    });

    it("can be called multiple times", () => {
      act(() => {
        useQuizTakingStore.getState().incrementFocusLoss();
        useQuizTakingStore.getState().incrementFocusLoss();
        useQuizTakingStore.getState().incrementFocusLoss();
      });

      expect(useQuizTakingStore.getState().focusLossCount).toBe(3);
    });
  });

  describe("reset action", () => {
    it("resets all state to initial values", () => {
      // Set up some state
      const answer = createMockAnswer("q-1", "opt-1");
      act(() => {
        useQuizTakingStore.setState({
          quizId: "quiz-1",
          attemptId: "attempt-1",
          questions: mockQuestions,
          currentQuestionIndex: 2,
          answers: { "q-1": answer },
          remainingSeconds: 100,
          timerStatus: "running",
          focusLossCount: 5,
          isDirty: true,
          lastSavedAt: new Date(),
        });
      });

      // Reset
      act(() => {
        useQuizTakingStore.getState().reset();
      });

      const state = useQuizTakingStore.getState();
      expect(state.quizId).toBeNull();
      expect(state.attemptId).toBeNull();
      expect(state.questions).toEqual([]);
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.answers).toEqual({});
      expect(state.remainingSeconds).toBeNull();
      expect(state.timerStatus).toBe("idle");
      expect(state.focusLossCount).toBe(0);
      expect(state.isDirty).toBe(false);
      expect(state.lastSavedAt).toBeNull();
    });
  });

  describe("state immutability", () => {
    it("maintains separate state instances", () => {
      act(() => {
        useQuizTakingStore.setState({ questions: mockQuestions });
      });

      const state1 = useQuizTakingStore.getState();

      act(() => {
        useQuizTakingStore.getState().navigateToQuestion(2);
      });

      const state2 = useQuizTakingStore.getState();

      expect(state1.currentQuestionIndex).toBe(0);
      expect(state2.currentQuestionIndex).toBe(2);
    });

    it("does not mutate answers object directly", () => {
      const answer = createMockAnswer("q-1", "opt-1");

      act(() => {
        useQuizTakingStore.getState().setAnswer("q-1", answer);
      });

      const state1 = useQuizTakingStore.getState();
      const answers1 = state1.answers;

      act(() => {
        useQuizTakingStore.getState().setAnswer("q-2", createMockAnswer("q-2", "opt-1"));
      });

      const state2 = useQuizTakingStore.getState();
      const answers2 = state2.answers;

      // Different references (immutability)
      expect(answers1).not.toBe(answers2);
    });
  });

  describe("timer integration", () => {
    it("supports full timer lifecycle: start -> pause -> resume -> expire", () => {
      // Start timer
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 3,
          timerStatus: "running",
        });
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("running");

      // Pause
      act(() => {
        useQuizTakingStore.getState().pauseTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("paused");

      // Resume
      act(() => {
        useQuizTakingStore.getState().resumeTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("running");

      // Tick to expire
      act(() => {
        useQuizTakingStore.getState().tickTimer();
        useQuizTakingStore.getState().tickTimer();
        useQuizTakingStore.getState().tickTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("expired");
      expect(useQuizTakingStore.getState().remainingSeconds).toBe(0);
    });
  });
});
