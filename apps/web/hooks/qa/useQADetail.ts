/**
 * useQADetail Hook - Q&A Question Detail Query
 * TASK-006: TanStack Query hook for Q&A question detail
 * REQ-FE-503: Q&A API hook definitions
 *
 * Fetches a single question with all answers and AI suggestion.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { qaKeys } from './qa-keys';
import type { QAQuestion } from '@shared';

/**
 * Hook for fetching Q&A question detail with answers
 *
 * @param questionId - The question ID to fetch
 * @returns UseQueryResult with question detail data
 *
 * @example
 * ```tsx
 * const { data: question, isLoading, error } = useQADetail('question-123');
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <ErrorState />;
 *
 * return (
 *   <div>
 *     <h1>{question.title}</h1>
 *     <MarkdownRenderer content={question.content} />
 *   </div>
 * );
 * ```
 */
export function useQADetail(
  questionId: string
): UseQueryResult<QAQuestion, Error> {
  return useQuery({
    queryKey: qaKeys.detail(questionId),
    queryFn: async () => {
      const response = await api.get<QAQuestion>(
        `/api/v1/qa/questions/${questionId}`
      );
      return response.data;
    },
    enabled: !!questionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
