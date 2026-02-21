/**
 * useQuizMutations Hook - Quiz CRUD Mutations
 * Quiz create, update, delete, publish, close, and duplicate mutations
 *
 * Provides mutation hooks for managing quizzes as an instructor.
 * Each mutation invalidates relevant queries on success.
 */

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  closeQuiz,
  duplicateQuiz,
} from "~/lib/supabase/quizzes";
import type { CreateQuizPayload, UpdateQuizPayload as SupabaseUpdateQuizPayload } from "~/lib/supabase/quizzes";
import type { CreateQuizInput, QuizDetail } from "@shared";

// ============================================================================
// Types
// ============================================================================

export interface UpdateQuizPayload {
  quizId: string;
  data: Partial<CreateQuizInput>;
}

export interface QuizIdPayload {
  quizId: string;
}

// ============================================================================
// useCreateQuiz
// ============================================================================

/**
 * Create a new quiz
 *
 * @returns UseMutationResult with created quiz data
 *
 * On Success:
 * - Invalidates ['instructor', 'quizzes'] to refresh list
 */
export function useCreateQuiz(): UseMutationResult<QuizDetail, Error, CreateQuizInput> {
  const queryClient = useQueryClient();

  return useMutation<QuizDetail, Error, CreateQuizInput>({
    mutationFn: (payload) => createQuiz(payload as CreateQuizPayload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["instructor", "quizzes"] });
    },
  });
}

// ============================================================================
// useUpdateQuiz
// ============================================================================

/**
 * Update an existing quiz
 *
 * @returns UseMutationResult with updated quiz data
 *
 * On Success:
 * - Invalidates ['quizzes', quizId] to refresh detail
 * - Invalidates ['instructor', 'quizzes'] to refresh list
 */
export function useUpdateQuiz(): UseMutationResult<QuizDetail, Error, UpdateQuizPayload> {
  const queryClient = useQueryClient();

  return useMutation<QuizDetail, Error, UpdateQuizPayload>({
    mutationFn: ({ quizId, data }) => updateQuiz(quizId, data as SupabaseUpdateQuizPayload),
    onSuccess: (_, { quizId }) => {
      void queryClient.invalidateQueries({ queryKey: ["quizzes", quizId] });
      void queryClient.invalidateQueries({ queryKey: ["instructor", "quizzes"] });
    },
  });
}

// ============================================================================
// useDeleteQuiz
// ============================================================================

/**
 * Delete a quiz
 *
 * @returns UseMutationResult with void on success
 *
 * On Success:
 * - Invalidates ['instructor', 'quizzes'] to refresh list
 */
export function useDeleteQuiz(): UseMutationResult<undefined, Error, QuizIdPayload> {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, QuizIdPayload>({
    mutationFn: ({ quizId }) => deleteQuiz(quizId) as Promise<undefined>,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["instructor", "quizzes"] });
    },
  });
}

// ============================================================================
// usePublishQuiz
// ============================================================================

/**
 * Publish a quiz (make available to students)
 *
 * @returns UseMutationResult with void on success
 *
 * On Success:
 * - Invalidates ['quizzes', quizId] to refresh detail
 * - Invalidates ['instructor', 'quizzes'] to refresh list
 */
export function usePublishQuiz(): UseMutationResult<undefined, Error, QuizIdPayload> {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, QuizIdPayload>({
    mutationFn: ({ quizId }) => publishQuiz(quizId) as Promise<undefined>,
    onSuccess: (_, { quizId }) => {
      void queryClient.invalidateQueries({ queryKey: ["quizzes", quizId] });
      void queryClient.invalidateQueries({ queryKey: ["instructor", "quizzes"] });
    },
  });
}

// ============================================================================
// useCloseQuiz
// ============================================================================

/**
 * Close a quiz (no more submissions)
 *
 * @returns UseMutationResult with void on success
 *
 * On Success:
 * - Invalidates ['quizzes', quizId] to refresh detail
 * - Invalidates ['instructor', 'quizzes'] to refresh list
 */
export function useCloseQuiz(): UseMutationResult<undefined, Error, QuizIdPayload> {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, QuizIdPayload>({
    mutationFn: ({ quizId }) => closeQuiz(quizId) as Promise<undefined>,
    onSuccess: (_, { quizId }) => {
      void queryClient.invalidateQueries({ queryKey: ["quizzes", quizId] });
      void queryClient.invalidateQueries({ queryKey: ["instructor", "quizzes"] });
    },
  });
}

// ============================================================================
// useDuplicateQuiz
// ============================================================================

/**
 * Duplicate a quiz
 *
 * @returns UseMutationResult with duplicated quiz data
 *
 * On Success:
 * - Invalidates ['instructor', 'quizzes'] to refresh list
 */
export function useDuplicateQuiz(): UseMutationResult<QuizDetail, Error, QuizIdPayload> {
  const queryClient = useQueryClient();

  return useMutation<QuizDetail, Error, QuizIdPayload>({
    mutationFn: ({ quizId }) => duplicateQuiz(quizId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["instructor", "quizzes"] });
    },
  });
}
