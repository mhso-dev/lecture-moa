/**
 * useRequestAISuggestion Hook - Request AI Suggestion Mutation
 * TASK-013: TanStack Query mutation for requesting AI suggestion
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-532: AI answer suggestion display
 *
 * Handles requesting AI suggestion for a question.
 * Sets aiSuggestionPending to true while waiting for AI response.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { qaKeys } from './qa-keys';
import { toast } from 'sonner';
import type { QAQuestion } from '@shared';

/**
 * Hook for requesting AI suggestion for a question
 *
 * @param questionId - The question ID to request AI suggestion for
 * @returns UseMutationResult for AI suggestion request
 *
 * @example
 * ```tsx
 * const { mutate: requestAI, isPending } = useRequestAISuggestion('question-123');
 *
 * {question.aiSuggestionPending ? (
 *   <div>AI가 답변을 생성 중...</div>
 * ) : (
 *   <Button onClick={() => requestAI()} disabled={isPending}>
 *     AI 답변 요청
 *   </Button>
 * )}
 * ```
 */
export function useRequestAISuggestion(
  questionId: string
): UseMutationResult<QAQuestion, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<QAQuestion>(
        `/api/v1/qa/questions/${questionId}/ai-suggest`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate question detail to refresh with pending state
      queryClient.invalidateQueries({
        queryKey: qaKeys.detail(questionId),
      });
      toast.success('AI 답변 요청이 접수되었습니다');
    },
    onError: (error) => {
      toast.error(error.message || 'AI 답변 요청에 실패했습니다');
    },
  });
}
