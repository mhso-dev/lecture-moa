/**
 * useQuizSubmission Hook
 * REQ-FE-617: Quiz Submission
 *
 * Manages quiz submission flow including:
 * - Calculate unanswered count
 * - Show confirmation dialog before submit
 * - Force save before submission
 * - POST to submit endpoint
 * - Navigate to results on success
 * - Reset store after submission
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";
import {
  submitQuizAttempt,
  saveDraftAnswers,
  getQuizResult,
} from "~/lib/supabase/quizzes";
import type { DraftAnswer, QuizModuleResult } from "@shared";

// ============================================================================
// Types
// ============================================================================

export interface UseQuizSubmissionOptions {
  quizId: string;
  attemptId: string;
  answers: Record<string, DraftAnswer>;
  totalQuestions: number;
}

export interface UseQuizSubmissionReturn {
  isSubmitting: boolean;
  submitError: Error | null;
  unansweredCount: number;
  showConfirmDialog: boolean;
  openConfirmDialog: () => void;
  closeConfirmDialog: () => void;
  confirmSubmit: () => Promise<QuizModuleResult | null>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Serialize a DraftAnswer into the simple {questionId, answer} format
 * expected by the Supabase saveDraftAnswers function.
 */
function serializeDraftAnswer(
  draft: DraftAnswer
): { questionId: string; answer: string } {
  switch (draft.type) {
    case "multiple_choice":
      return {
        questionId: draft.questionId,
        answer: draft.selectedOptionId ?? "",
      };
    case "true_false":
      return {
        questionId: draft.questionId,
        answer: draft.selectedAnswer != null ? String(draft.selectedAnswer) : "",
      };
    case "short_answer":
      return {
        questionId: draft.questionId,
        answer: draft.text,
      };
    case "fill_in_the_blank":
      return {
        questionId: draft.questionId,
        answer: JSON.stringify(draft.filledAnswers),
      };
    default:
      return {
        questionId: (draft as DraftAnswer).questionId,
        answer: "",
      };
  }
}

/**
 * Check if an answer has actual content
 */
function hasAnswerContent(answer: DraftAnswer | undefined): boolean {
  if (!answer) {
    return false;
  }

  switch (answer.type) {
    case "multiple_choice":
      return answer.selectedOptionId !== null;
    case "true_false":
      return answer.selectedAnswer !== null;
    case "short_answer":
      return true; // Empty string is still an answer
    case "fill_in_the_blank":
      return true; // Empty object is still an answer
    default:
      return false;
  }
}

/**
 * Calculate unanswered questions count
 */
function calculateUnansweredCount(
  answers: Record<string, DraftAnswer>,
  totalQuestions: number
): number {
  const answeredCount = Object.values(answers).filter(hasAnswerContent).length;
  return totalQuestions - answeredCount;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Quiz submission hook
 *
 * @param options - Configuration options
 * @returns Submission state and control functions
 *
 * Features:
 * - Tracks unanswered questions
 * - Manages confirmation dialog state
 * - Handles submission with force save
 * - Navigates to results on success
 * - Resets store after submission
 */
export function useQuizSubmission({
  quizId,
  attemptId,
  answers,
  totalQuestions,
}: UseQuizSubmissionOptions): UseQuizSubmissionReturn {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const reset = useQuizTakingStore((state) => state.reset);

  // Calculate unanswered count
  const unansweredCount = calculateUnansweredCount(answers, totalQuestions);

  // Dialog controls
  const openConfirmDialog = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // Confirm and submit
  const confirmSubmit = useCallback(async (): Promise<QuizModuleResult | null> => {
    if (!attemptId) {
      return null;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Force save current answers before submission
      const serialized = Object.values(answers).map(serializeDraftAnswer);
      await saveDraftAnswers(attemptId, serialized);

      // Submit and grade the quiz
      await submitQuizAttempt(attemptId);

      // Fetch the graded result to preserve the return type
      const result = await getQuizResult(quizId, attemptId);

      // Close dialog on success
      setShowConfirmDialog(false);

      // Reset the store
      reset();

      // Navigate to results page
      router.push(`/quizzes/${quizId}/results?attemptId=${attemptId}`);

      return result;
    } catch (error) {
      setSubmitError(error instanceof Error ? error : new Error("Submission failed"));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [quizId, attemptId, answers, reset, router]);

  return {
    isSubmitting,
    submitError,
    unansweredCount,
    showConfirmDialog,
    openConfirmDialog,
    closeConfirmDialog,
    confirmSubmit,
  };
}
