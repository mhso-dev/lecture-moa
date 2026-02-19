/**
 * useAcceptAnswer Hook - Accept Answer Mutation with Optimistic Update
 * TASK-009: TanStack Query mutation for accepting answer
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-535: Accept answer action with optimistic update
 *
 * Handles accepting an answer with optimistic cache update.
 * Only one answer can be accepted per question.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { qaKeys } from './qa-keys';
import { toast } from 'sonner';
import type { QAAnswer, QAQuestion } from '@shared';

/**
 * Context for optimistic update rollback
 */
interface OptimisticContext {
  previousQuestion: QAQuestion | undefined;
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
): UseMutationResult<QAAnswer, Error, string, OptimisticContext> {
  const queryClient = useQueryClient();
  const queryKey = qaKeys.detail(questionId);

  return useMutation({
    mutationFn: async (answerId: string) => {
      const response = await api.patch<QAAnswer>(
        `/api/v1/qa/questions/${questionId}/answers/${answerId}/accept`
      );
      return response.data;
    },

    // Optimistic update before mutation
    onMutate: async (_answerId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousQuestion = queryClient.getQueryData<QAQuestion>(queryKey);

      // Optimistically update to the new value
      if (previousQuestion) {
        queryClient.setQueryData<QAQuestion>(queryKey, {
          ...previousQuestion,
          status: 'RESOLVED',
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
      queryClient.invalidateQueries({ queryKey });
    },

    onSuccess: () => {
      toast.success('답변이 채택되었습니다');
    },
  });
}
