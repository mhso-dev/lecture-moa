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
import { submitQuizAttempt, saveDraftAnswers } from "~/lib/api/quiz.api";
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
      const answersArray = Object.values(answers);
      await saveDraftAnswers(quizId, attemptId, answersArray);

      // Submit the quiz
      const result = await submitQuizAttempt(quizId, attemptId);

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
