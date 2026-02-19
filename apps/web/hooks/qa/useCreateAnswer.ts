/**
 * useCreateAnswer Hook - Create Answer Mutation
 * TASK-008: TanStack Query mutation for creating answer
 * REQ-FE-503: Q&A API hook definitions
 *
 * Handles answer creation with automatic cache invalidation.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { qaKeys } from './qa-keys';
import { toast } from 'sonner';
import type { QAAnswer } from '@shared';

/**
 * Hook for creating a new answer to a question
 *
 * @param questionId - The question ID to add answer to
 * @returns UseMutationResult with created answer data
 *
 * @example
 * ```tsx
 * const { mutate: createAnswer, isPending } = useCreateAnswer('question-123');
 *
 * const handleSubmit = (content: string) => {
 *   createAnswer(content, {
 *     onSuccess: () => {
 *       form.reset();
 *     },
 *   });
 * };
 * ```
 */
export function useCreateAnswer(
  questionId: string
): UseMutationResult<QAAnswer, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post<QAAnswer>(
        `/api/v1/qa/questions/${questionId}/answers`,
        { content }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate question detail to refresh answers
      queryClient.invalidateQueries({
        queryKey: qaKeys.detail(questionId),
      });
      toast.success('답변이 등록되었습니다');
    },
    onError: (error) => {
      toast.error(error.message || '답변 등록에 실패했습니다');
    },
  });
}
