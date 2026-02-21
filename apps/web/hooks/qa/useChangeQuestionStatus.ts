/**
 * useChangeQuestionStatus Hook - Change Question Status Mutation
 * TASK-012: TanStack Query mutation for changing question status
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-540: Instructor moderation actions
 * REQ-BE-004-018: Supabase direct query for status change
 *
 * Handles changing question status (OPEN, RESOLVED, CLOSED).
 * Instructor-only action.
 * Uses Supabase query layer instead of REST API.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { changeQuestionStatus as changeQuestionStatusQuery } from '~/lib/supabase/qa';
import { qaKeys } from './qa-keys';
import { toast } from 'sonner';
import type { QAStatus } from '@shared';

/**
 * Hook for changing question status
 *
 * @param questionId - The question ID to update
 * @returns UseMutationResult for status change operation
 *
 * @example
 * ```tsx
 * const { mutate: changeStatus, isPending } = useChangeQuestionStatus('question-123');
 *
 * <Select
 *   value={question.status}
 *   onValueChange={(status) => changeStatus(status as QAStatus)}
 *   disabled={isPending}
 * >
 *   <SelectItem value="OPEN">Open</SelectItem>
 *   <SelectItem value="RESOLVED">Resolved</SelectItem>
 *   <SelectItem value="CLOSED">Closed</SelectItem>
 * </Select>
 * ```
 */
export function useChangeQuestionStatus(
  questionId: string
): UseMutationResult<void, Error, QAStatus> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: QAStatus) => {
      await changeQuestionStatusQuery(questionId, status);
    },
    onSuccess: () => {
      // Invalidate question detail
      void queryClient.invalidateQueries({
        queryKey: qaKeys.detail(questionId),
      });
      // Invalidate list to update status badge
      void queryClient.invalidateQueries({
        queryKey: qaKeys.lists(),
      });
      toast.success('상태가 변경되었습니다');
    },
    onError: (error) => {
      toast.error(error.message || '상태 변경에 실패했습니다');
    },
  });
}
