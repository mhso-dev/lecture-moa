/**
 * useQuizAnswers Hook - Answer Management
 * Answer management for quiz-taking
 *
 * Provides functions for managing quiz answers with the store.
 * Includes answer state tracking and utility functions.
 */

import { useCallback } from "react";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";
import type {
  DraftAnswer,
  MultipleChoiceDraftAnswer,
  TrueFalseDraftAnswer,
  ShortAnswerDraftAnswer,
  FillInBlankDraftAnswer,
} from "@shared";

interface UseQuizAnswersReturn {
  answers: Record<string, DraftAnswer>;
  isDirty: boolean;
  getAnswer: (questionId: string) => DraftAnswer | undefined;
  setAnswer: (
    questionId: string,
    type: DraftAnswer["type"],
    data: AnswerData
  ) => void;
  clearAnswer: (questionId: string) => void;
  hasAnswer: (questionId: string) => boolean;
  getAllAnswers: () => DraftAnswer[];
  getAnsweredCount: () => number;
}

type AnswerData =
  | { selectedOptionId: string | null }
  | { selectedAnswer: boolean | null }
  | { text: string }
  | { filledAnswers: Record<string, string> };

/**
 * Check if an answer has actual content
 */
function hasContent(answer: DraftAnswer | undefined): boolean {
  if (!answer) {
    return false;
  }

  switch (answer.type) {
    case "multiple_choice":
      return answer.selectedOptionId !== null;
    case "true_false":
      return answer.selectedAnswer !== null;
    case "short_answer":
      return true; // Empty string is still considered an answer
    case "fill_in_the_blank":
      return true; // Empty object is still considered an answer
    default:
      return false;
  }
}

/**
 * Quiz Answers Hook
 *
 * @returns Answer state and management functions
 *
 * Features:
 * - O(1) answer lookup by questionId
 * - Type-safe answer creation
 * - Tracks dirty state for auto-save
 * - Utility functions for answer management
 */
export function useQuizAnswers(): UseQuizAnswersReturn {
  const answers = useQuizTakingStore((state) => state.answers);
  const isDirty = useQuizTakingStore((state) => state.isDirty);
  const setAnswerAction = useQuizTakingStore((state) => state.setAnswer);

  // Get a single answer
  const getAnswer = useCallback(
    (questionId: string): DraftAnswer | undefined => {
      return answers[questionId];
    },
    [answers]
  );

  // Set an answer with proper typing
  const setAnswer = useCallback(
    (questionId: string, type: DraftAnswer["type"], data: AnswerData): void => {
      let answer: DraftAnswer;

      switch (type) {
        case "multiple_choice":
          answer = {
            questionId,
            type: "multiple_choice",
            ...(data as { selectedOptionId: string | null }),
          } as MultipleChoiceDraftAnswer;
          break;
        case "true_false":
          answer = {
            questionId,
            type: "true_false",
            ...(data as { selectedAnswer: boolean | null }),
          } as TrueFalseDraftAnswer;
          break;
        case "short_answer":
          answer = {
            questionId,
            type: "short_answer",
            ...(data as { text: string }),
          } as ShortAnswerDraftAnswer;
          break;
        case "fill_in_the_blank":
          answer = {
            questionId,
            type: "fill_in_the_blank",
            ...(data as { filledAnswers: Record<string, string> }),
          } as FillInBlankDraftAnswer;
          break;
        default:
          throw new Error(`Unknown answer type: ${String(type)}`);
      }

      setAnswerAction(questionId, answer);
    },
    [setAnswerAction]
  );

  // Clear an answer (reset to default/cleared state)
  const clearAnswer = useCallback(
    (questionId: string): void => {
      // Set to a cleared state - default to multiple_choice with null
      const clearedAnswer: MultipleChoiceDraftAnswer = {
        questionId,
        type: "multiple_choice",
        selectedOptionId: null,
      };
      setAnswerAction(questionId, clearedAnswer);
    },
    [setAnswerAction]
  );

  // Check if a question has been answered
  const hasAnswer = useCallback(
    (questionId: string): boolean => {
      const answer = answers[questionId];
      return hasContent(answer);
    },
    [answers]
  );

  // Get all answers as an array
  const getAllAnswers = useCallback((): DraftAnswer[] => {
    return Object.values(answers);
  }, [answers]);

  // Get count of answered questions
  const getAnsweredCount = useCallback((): number => {
    return Object.values(answers).filter((answer: DraftAnswer) => hasContent(answer)).length;
  }, [answers]);

  return {
    answers,
    isDirty,
    getAnswer,
    setAnswer,
    clearAnswer,
    hasAnswer,
    getAllAnswers,
    getAnsweredCount,
  };
}
