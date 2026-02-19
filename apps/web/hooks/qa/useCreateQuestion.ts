/**
 * useCreateQuestion Hook - Create Question Mutation
 * TASK-007: TanStack Query mutation for creating Q&A question
 * REQ-FE-503: Q&A API hook definitions
 *
 * Handles question creation with automatic cache invalidation.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { qaKeys } from './qa-keys';
import { toast } from 'sonner';
import type { QACreateRequest, QAQuestion } from '@shared';

/**
 * Hook for creating a new Q&A question
 *
 * @returns UseMutationResult with created question data
 *
 * @example
 * ```tsx
 * const { mutate: createQuestion, isPending } = useCreateQuestion();
 *
 * const handleSubmit = (data: CreateQuestionInput) => {
 *   createQuestion(data, {
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

  return useMutation({
    mutationFn: async (data: QACreateRequest) => {
      const response = await api.post<QAQuestion>('/api/v1/qa/questions', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all list queries to refresh the list
      queryClient.invalidateQueries({ queryKey: qaKeys.lists() });
      toast.success('질문이 등록되었습니다');
    },
    onError: (error) => {
      toast.error(error.message || '질문 등록에 실패했습니다');
    },
  });
}
