/**
 * useQuizAutoSave Hook
 * REQ-FE-616: Auto-Save Draft Answers
 *
 * Manages automatic saving of draft answers with:
 * - 3000ms debounce using existing useDebounce hook
 * - Auto-save when isDirty becomes true
 * - Reset isDirty and update lastSavedAt on success
 * - Retry after 5 seconds on failure
 * - Force save on navigation using existing useBeforeUnload hook
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { useDebounce } from "~/hooks/useDebounce";
import { useBeforeUnload } from "~/hooks/useBeforeUnload";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";
import { saveDraftAnswers } from "~/lib/supabase/quizzes";
import type { DraftAnswer } from "@shared";

// ============================================================================
// Types
// ============================================================================

export interface UseQuizAutoSaveOptions {
  quizId: string;
  attemptId: string;
  isDirty: boolean;
  answers: Record<string, DraftAnswer>;
  focusLossCount: number;
  enabled?: boolean;
}

export interface UseQuizAutoSaveReturn {
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: Error | null;
  forceSave: () => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const DEBOUNCE_DELAY_MS = 3000;
const RETRY_DELAY_MS = 5000;

// ============================================================================
// Serialization
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

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Auto-save hook for quiz draft answers
 *
 * @param options - Configuration options
 * @returns Auto-save state and control functions
 *
 * Features:
 * - Debounced auto-save (3 seconds)
 * - Retry on failure (5 second delay)
 * - Force save capability
 * - Navigation guard integration
 */
export function useQuizAutoSave({
  quizId: _quizId,
  attemptId,
  isDirty,
  answers,
  focusLossCount: _focusLossCount,
  enabled = true,
}: UseQuizAutoSaveOptions): UseQuizAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const markSaved = useQuizTakingStore((state) => state.markSaved);
  const lastSavedAt = useQuizTakingStore((state) => state.lastSavedAt);

  // Debounce the dirty state and answers
  const debouncedIsDirty = useDebounce(isDirty, DEBOUNCE_DELAY_MS);
  const debouncedAnswers = useDebounce(answers, DEBOUNCE_DELAY_MS);

  // Perform the save operation
  const performSave = useCallback(async (): Promise<boolean> => {
    if (!attemptId || !enabled) {
      return false;
    }

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const serialized = Object.values(debouncedAnswers).map(serializeDraftAnswer);
      await saveDraftAnswers(attemptId, serialized);

      if (isMountedRef.current) {
        markSaved();
        setSaveError(null);
      }

      return true;
    } catch (error) {
      if (isMountedRef.current) {
        setSaveError(error instanceof Error ? error : new Error("Save failed"));

        // Schedule retry
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && isDirty) {
            void performSave();
          }
        }, RETRY_DELAY_MS);
      }

      return false;
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [attemptId, debouncedAnswers, enabled, markSaved, isDirty]);

  // Force save function (immediate, no debounce)
  const forceSave = useCallback(async (): Promise<void> => {
    if (!attemptId) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const serialized = Object.values(answers).map(serializeDraftAnswer);
      await saveDraftAnswers(attemptId, serialized);

      if (isMountedRef.current) {
        markSaved();
      }
    } catch (error) {
      if (isMountedRef.current) {
        setSaveError(error instanceof Error ? error : new Error("Save failed"));
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [attemptId, answers, markSaved]);

  // Trigger auto-save when debounced isDirty becomes true
  useEffect(() => {
    if (debouncedIsDirty && enabled && attemptId) {
      void performSave();
    }
  }, [debouncedIsDirty, enabled, attemptId, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Navigation guard - warn on unsaved changes
  useBeforeUnload(isDirty && enabled);

  return {
    isSaving,
    lastSavedAt,
    saveError,
    forceSave,
  };
}
