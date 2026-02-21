/**
 * useRequestAISuggestion Hook - Request AI Suggestion Mutation (Graceful Failure Stub)
 * TASK-013: TanStack Query mutation for requesting AI suggestion
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-532: AI answer suggestion display
 * REQ-BE-004-031: Graceful failure stub until SPEC-AI-001 is implemented
 *
 * AI suggestion feature is not yet implemented. This hook returns a graceful
 * failure stub until SPEC-AI-001 delivers the actual AI service.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { qaKeys } from './qa-keys';
import { toast } from 'sonner';
import type { QAQuestion } from '@shared';

/**
 * Hook for requesting AI suggestion for a question
 *
 * Currently a graceful failure stub. Returns an error indicating the feature
 * is not yet available. Will be replaced in SPEC-AI-001.
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
    mutationFn: async (): Promise<QAQuestion> => {
      throw new Error('AI 추천 기능은 준비 중입니다');
    },
    onSuccess: () => {
      // Invalidate question detail to refresh with pending state
      void queryClient.invalidateQueries({
        queryKey: qaKeys.detail(questionId),
      });
    },
    onError: (error) => {
      toast.error(error.message || 'AI 답변 요청에 실패했습니다');
    },
  });
}
