/**
 * Quiz Taking Store
 * REQ-FE-611: Zustand store for quiz-taking state management
 *
 * Manages state for quiz-taking experience including:
 * - Current quiz and attempt tracking
 * - Question navigation
 * - Answer management with O(1) lookup
 * - Timer state management
 * - Focus loss tracking
 * - Auto-save state tracking
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Question, DraftAnswer } from "@shared";

// ============================================================================
// Types
// ============================================================================

export type TimerStatus = "idle" | "running" | "paused" | "expired";

export interface QuizTakingState {
  quizId: string | null;
  attemptId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, DraftAnswer>;
  remainingSeconds: number | null;
  timerStatus: TimerStatus;
  focusLossCount: number;
  isDirty: boolean;
  lastSavedAt: Date | null;
}

export interface QuizTakingActions {
  setAnswer: (questionId: string, answer: DraftAnswer) => void;
  navigateToQuestion: (index: number) => void;
  markSaved: () => void;
  tickTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  incrementFocusLoss: () => void;
  reset: () => void;
}

export type QuizTakingStore = QuizTakingState & QuizTakingActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: QuizTakingState = {
  quizId: null,
  attemptId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  remainingSeconds: null,
  timerStatus: "idle",
  focusLossCount: 0,
  isDirty: false,
  lastSavedAt: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Quiz Taking Store - Manages quiz-taking state
 *
 * State:
 * - quizId: Current quiz ID being taken
 * - attemptId: Current attempt ID
 * - questions: Array of quiz questions
 * - currentQuestionIndex: Index of currently displayed question
 * - answers: Record of answers keyed by questionId for O(1) lookup
 * - remainingSeconds: Remaining time in seconds (null if no timer)
 * - timerStatus: Current timer state
 * - focusLossCount: Number of times user left the tab/window
 * - isDirty: Whether there are unsaved changes
 * - lastSavedAt: Timestamp of last successful save
 *
 * Actions:
 * - setAnswer: Set/update answer for a question
 * - navigateToQuestion: Navigate to a specific question index
 * - markSaved: Mark current state as saved
 * - tickTimer: Decrement timer by 1 second
 * - pauseTimer: Pause the timer
 * - resumeTimer: Resume the timer
 * - incrementFocusLoss: Increment focus loss counter
 * - reset: Reset store to initial state
 *
 * Middleware:
 * - immer: Enables immutable state updates with mutable syntax
 * - devtools: Redux DevTools integration in development
 */
export const useQuizTakingStore = create<QuizTakingStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      setAnswer: (questionId, answer) => {
        set(
          (state) => {
            state.answers[questionId] = answer;
            state.isDirty = true;
          },
          false,
          "quizTaking/setAnswer"
        );
      },

      navigateToQuestion: (index) => {
        set(
          (state) => {
            state.currentQuestionIndex = index;
          },
          false,
          "quizTaking/navigateToQuestion"
        );
      },

      markSaved: () => {
        set(
          (state) => {
            state.isDirty = false;
            state.lastSavedAt = new Date();
          },
          false,
          "quizTaking/markSaved"
        );
      },

      tickTimer: () => {
        const { remainingSeconds, timerStatus } = get();

        // Only tick when timer is running
        if (timerStatus !== "running" || remainingSeconds === null) {
          return;
        }

        set(
          (state) => {
            if (state.remainingSeconds !== null && state.remainingSeconds > 0) {
              state.remainingSeconds -= 1;

              // Check for expiration
              if (state.remainingSeconds === 0) {
                state.timerStatus = "expired";
              }
            }
          },
          false,
          "quizTaking/tickTimer"
        );
      },

      pauseTimer: () => {
        const { timerStatus } = get();

        // Only pause when running
        if (timerStatus === "running") {
          set(
            (state) => {
              state.timerStatus = "paused";
            },
            false,
            "quizTaking/pauseTimer"
          );
        }
      },

      resumeTimer: () => {
        const { timerStatus } = get();

        // Only resume when paused
        if (timerStatus === "paused") {
          set(
            (state) => {
              state.timerStatus = "running";
            },
            false,
            "quizTaking/resumeTimer"
          );
        }
      },

      incrementFocusLoss: () => {
        set(
          (state) => {
            state.focusLossCount += 1;
          },
          false,
          "quizTaking/incrementFocusLoss"
        );
      },

      reset: () => {
        set(
          (state) => {
            // Reset all state to initial values using immer
            state.quizId = initialState.quizId;
            state.attemptId = initialState.attemptId;
            state.questions = initialState.questions;
            state.currentQuestionIndex = initialState.currentQuestionIndex;
            state.answers = initialState.answers;
            state.remainingSeconds = initialState.remainingSeconds;
            state.timerStatus = initialState.timerStatus;
            state.focusLossCount = initialState.focusLossCount;
            state.isDirty = initialState.isDirty;
            state.lastSavedAt = initialState.lastSavedAt;
          },
          false,
          "quizTaking/reset"
        );
      },
    })),
    {
      name: "QuizTakingStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);
