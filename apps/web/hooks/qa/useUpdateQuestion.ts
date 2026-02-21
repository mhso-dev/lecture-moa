/**
 * useUpdateQuestion Hook - Update Question Mutation
 * TASK-007: TanStack Query mutation for updating question
 * REQ-FE-503: Q&A API hook definitions
 * REQ-BE-004-013: Supabase query layer migration
 *
 * Handles question update with automatic cache invalidation.
 */

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { updateQuestion } from "~/lib/supabase/qa";
import { qaKeys } from "./qa-keys";
import { toast } from "sonner";
import type { QAQuestion } from "@shared";

/**
 * Update question payload
 */
interface UpdateQuestionPayload {
  title?: string;
  content?: string;
}

/**
 * Hook for updating a question
 *
 * @param questionId - The question ID to update
 * @returns UseMutationResult with updated question data
 *
 * @example
 * ```tsx
 * const { mutate: update, isPending } = useUpdateQuestion('question-123');
 *
 * const handleSubmit = (data: { title: string; content: string }) => {
 *   update(data, {
 *     onSuccess: () => {
 *       setIsEditing(false);
 *     },
 *   });
 * };
 * ```
 */
export function useUpdateQuestion(
  questionId: string
): UseMutationResult<QAQuestion, Error, UpdateQuestionPayload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateQuestionPayload) => {
      return updateQuestion(questionId, payload);
    },
    onSuccess: () => {
      // Invalidate question detail to refresh
      void queryClient.invalidateQueries({
        queryKey: qaKeys.detail(questionId),
      });
      // Also invalidate list queries
      void queryClient.invalidateQueries({
        queryKey: qaKeys.lists(),
      });
      toast.success("질문이 수정되었습니다");
    },
    onError: (error) => {
      toast.error(error.message || "질문 수정에 실패했습니다");
    },
  });
}
