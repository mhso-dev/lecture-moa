/**
 * useUpvoteQuestion Hook - Upvote Question Mutation with Optimistic Update
 * TASK-010: TanStack Query mutation for upvoting question
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-536: Upvote interaction with optimistic update
 * REQ-BE-004-020: Supabase direct query for question vote toggle
 *
 * Handles toggling upvote on a question with optimistic cache update.
 * Uses Supabase query layer instead of REST API.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toggleQuestionVote } from '~/lib/supabase/qa';
import { useAuth } from '~/hooks/useAuth';
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
): UseMutationResult<{ voted: boolean; newCount: number }, Error, void, OptimisticContext> {
  const queryClient = useQueryClient();
  const queryKey = qaKeys.detail(questionId);
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('로그인이 필요합니다');
      }
      return toggleQuestionVote(questionId, user.id);
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
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
