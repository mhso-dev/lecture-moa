/**
 * useUpvoteQuestion Hook - Upvote Question Mutation with Optimistic Update
 * TASK-010: TanStack Query mutation for upvoting question
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-536: Upvote interaction with optimistic update
 *
 * Handles toggling upvote on a question with optimistic cache update.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { qaKeys } from './qa-keys';
import type { QAQuestion } from '@shared';

/**
 * Context for optimistic update rollback
 */
interface OptimisticContext {
  previousQuestion: QAQuestion | undefined;
}

/**
 * Hook for toggling upvote on a question
 *
 * @param questionId - The question ID to upvote
 * @returns UseMutationResult for upvote operation
 *
 * @example
 * ```tsx
 * const { mutate: upvote, isPending } = useUpvoteQuestion('question-123');
 *
 * <Button
 *   onClick={() => upvote()}
 *   disabled={isPending}
 * >
 *   {question.isUpvoted ? 'Upvoted' : 'Upvote'} ({question.upvoteCount})
 * </Button>
 * ```
 */
export function useUpvoteQuestion(
  questionId: string
): UseMutationResult<QAQuestion, Error, void, OptimisticContext> {
  const queryClient = useQueryClient();
  const queryKey = qaKeys.detail(questionId);

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<QAQuestion>(
        `/api/v1/qa/questions/${questionId}/upvote`
      );
      return response.data;
    },

    // Optimistic update before mutation
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousQuestion = queryClient.getQueryData<QAQuestion>(queryKey);

      // Optimistically toggle upvote state
      if (previousQuestion) {
        queryClient.setQueryData<QAQuestion>(queryKey, {
          ...previousQuestion,
          isUpvoted: !previousQuestion.isUpvoted,
          upvoteCount: previousQuestion.isUpvoted
            ? previousQuestion.upvoteCount - 1
            : previousQuestion.upvoteCount + 1,
        });
      }

      return { previousQuestion };
    },

    // Rollback on error
    onError: (_error, _variables, context) => {
      if (context?.previousQuestion) {
        queryClient.setQueryData(queryKey, context.previousQuestion);
      }
    },

    // Always refetch after success or error to ensure sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
