/**
 * useCreateQuestion Hook - Create Question Mutation
 * TASK-007: TanStack Query mutation for creating Q&A question
 * REQ-FE-503: Q&A API hook definitions
 * REQ-BE-004-012: Supabase query layer migration
 *
 * Handles question creation with automatic cache invalidation.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { createQuestion } from '~/lib/supabase/qa';
import { qaKeys } from './qa-keys';
import { useAuth } from '~/hooks/useAuth';
import { toast } from 'sonner';
import type { QACreateRequest, QAQuestion } from '@shared';

/**
 * Hook for creating a new Q&A question
 *
 * @returns UseMutationResult with created question data
 *
 * @example
 * ```tsx
 * const { mutate: create, isPending } = useCreateQuestion();
 *
 * const handleSubmit = (data: CreateQuestionInput) => {
 *   create(data, {
 *     onSuccess: (question) => {
 *       router.push(`/qa/${question.id}`);
 *     },
 *   });
 * };
 * ```
 */
export function useCreateQuestion(): UseMutationResult<
  QAQuestion,
  Error,
  QACreateRequest
> {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: QACreateRequest) => {
      if (!user?.id) {
        throw new Error('로그인이 필요합니다');
      }
      return createQuestion(data, user.id);
    },
    onSuccess: (_data, variables) => {
      // Invalidate all list queries to refresh the list
      void queryClient.invalidateQueries({ queryKey: qaKeys.lists() });
      // REQ-FE-009: Invalidate highlights for this material to refresh <mark> elements
      if (variables.materialId) {
        void queryClient.invalidateQueries({
          queryKey: qaKeys.highlights(variables.materialId),
        });
      }
      toast.success('질문이 등록되었습니다');
    },
    onError: (error) => {
      toast.error(error.message || '질문 등록에 실패했습니다');
    },
  });
}
