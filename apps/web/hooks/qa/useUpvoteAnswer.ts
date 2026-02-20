/**
 * useUpvoteAnswer Hook - Upvote Answer Mutation
 * TASK-011: TanStack Query mutation for upvoting answer
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-536: Upvote interaction with optimistic update
 *
 * Handles toggling upvote on an answer with optimistic cache update.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { qaKeys } from './qa-keys';
import type { QAAnswer } from '@shared';

/**
 * Hook for toggling upvote on an answer
 *
 * @param questionId - The question ID (for cache invalidation)
 * @returns UseMutationResult for upvote operation
 *
 * @example
 * ```tsx
 * const { mutate: upvote, isPending } = useUpvoteAnswer('question-123');
 *
 * <Button
 *   onClick={() => upvote('answer-456')}
 *   disabled={isPending}
 * >
 *   {answer.isUpvoted ? 'Upvoted' : 'Upvote'} ({answer.upvoteCount})
 * </Button>
 * ```
 */
export function useUpvoteAnswer(
  questionId: string
): UseMutationResult<QAAnswer, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (answerId: string) => {
      const response = await api.post<QAAnswer>(
        `/api/v1/qa/questions/${questionId}/answers/${answerId}/upvote`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate question detail to refresh answer list
      void queryClient.invalidateQueries({
        queryKey: qaKeys.detail(questionId),
      });
    },
  });
}
