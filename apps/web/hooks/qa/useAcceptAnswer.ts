/**
 * useAcceptAnswer Hook - Accept Answer Mutation with Optimistic Update
 * TASK-009: TanStack Query mutation for accepting answer
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-535: Accept answer action with optimistic update
 * REQ-BE-004-016: Supabase direct query for answer acceptance
 *
 * Handles accepting an answer with optimistic cache update.
 * Only one answer can be accepted per question.
 * Uses Supabase query layer instead of REST API.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { acceptAnswer as acceptAnswerQuery } from '~/lib/supabase/qa';
import { qaKeys } from './qa-keys';
import { toast } from 'sonner';
import type { QAQuestion } from '@shared';

/**
 * Context for optimistic update rollback
 */
interface OptimisticContext {
  previousQuestion: (QAQuestion & { answers: unknown[] }) | undefined;
}

/**
 * Hook for accepting an answer to a question
 *
 * @param questionId - The question ID
 * @returns UseMutationResult for accepting answer
 *
 * @example
 * ```tsx
 * const { mutate: acceptAnswer, isPending } = useAcceptAnswer('question-123');
 *
 * <Button onClick={() => acceptAnswer('answer-456')}>
 *   채택하기
 * </Button>
 * ```
 */
export function useAcceptAnswer(
  questionId: string
): UseMutationResult<void, Error, string, OptimisticContext> {
  const queryClient = useQueryClient();
  const queryKey = qaKeys.detail(questionId);

  return useMutation({
    mutationFn: async (answerId: string) => {
      await acceptAnswerQuery(questionId, answerId);
    },

    // Optimistic update before mutation
    onMutate: async (answerId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousQuestion = queryClient.getQueryData<QAQuestion & { answers: unknown[] }>(queryKey);

      // Optimistically update to the new value
      if (previousQuestion) {
        queryClient.setQueryData(queryKey, {
          ...previousQuestion,
          status: 'RESOLVED',
          answers: Array.isArray(previousQuestion.answers)
            ? previousQuestion.answers.map((a) => ({
                ...(a as Record<string, unknown>),
                isAccepted: (a as Record<string, unknown>).id === answerId,
              }))
            : previousQuestion.answers,
        });
      }

      return { previousQuestion };
    },

    // Rollback on error
    onError: (error, _variables, context) => {
      if (context?.previousQuestion) {
        queryClient.setQueryData(queryKey, context.previousQuestion);
      }
      toast.error(error.message || '답변 채택에 실패했습니다');
    },

    // Always refetch after success or error
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },

    onSuccess: () => {
      toast.success('답변이 채택되었습니다');
    },
  });
}
