/**
 * useUpvoteAnswer Hook - Upvote Answer Mutation with Optimistic Update
 * TASK-011: TanStack Query mutation for upvoting answer
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-536: Upvote interaction with optimistic update
 * REQ-BE-004-021: Supabase direct query for answer vote toggle
 *
 * Handles toggling upvote on an answer with optimistic cache update.
 * Uses Supabase query layer instead of REST API.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toggleAnswerVote } from '~/lib/supabase/qa';
import { useAuth } from '~/hooks/useAuth';
import { qaKeys } from './qa-keys';
import type { QAQuestion, QAAnswer } from '@shared';

/**
 * Context for optimistic update rollback
 */
interface OptimisticContext {
  previousData: (QAQuestion & { answers: QAAnswer[] }) | undefined;
}

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
): UseMutationResult<{ voted: boolean; newCount: number }, Error, string, OptimisticContext> {
  const queryClient = useQueryClient();
  const queryKey = qaKeys.detail(questionId);
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (answerId: string) => {
      if (!user?.id) {
        throw new Error('로그인이 필요합니다');
      }
      return toggleAnswerVote(answerId, user.id);
    },

    // Optimistic update before mutation
    onMutate: async (answerId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<QAQuestion & { answers: QAAnswer[] }>(queryKey);

      // Optimistically toggle upvote state on the specific answer
      if (previousData && Array.isArray(previousData.answers)) {
        queryClient.setQueryData(queryKey, {
          ...previousData,
          answers: previousData.answers.map((answer: QAAnswer) =>
            answer.id === answerId
              ? {
                  ...answer,
                  isUpvoted: !answer.isUpvoted,
                  upvoteCount: answer.isUpvoted
                    ? answer.upvoteCount - 1
                    : answer.upvoteCount + 1,
                }
              : answer
          ),
        });
      }

      return { previousData };
    },

    // Rollback on error
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    // Always refetch after success or error to ensure sync
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
