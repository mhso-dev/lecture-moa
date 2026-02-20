/**
 * useGenerateInviteCode Hook - Generate Course Invite Code
 * TASK-015: Generate Invite Code
 *
 * Handles generating new invite codes for courses.
 * REQ-FE-434: Generate New Invite Code
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { generateInviteCode } from '~/lib/supabase/courses';
import type { InviteCodeResponse, Course } from '@shared';

interface GenerateInviteCodeVariables {
  courseId: string;
}

/**
 * Hook for generating a new invite code for a course
 *
 * @returns UseMutationResult with invite code response
 */
export function useGenerateInviteCode(): UseMutationResult<InviteCodeResponse, Error, GenerateInviteCodeVariables> {
  const queryClient = useQueryClient();

  return useMutation<InviteCodeResponse, Error, GenerateInviteCodeVariables>({
    mutationFn: ({ courseId }: GenerateInviteCodeVariables): Promise<InviteCodeResponse> =>
      generateInviteCode(courseId),

    onSuccess: (data: InviteCodeResponse, { courseId }: GenerateInviteCodeVariables) => {
      // Update the course query with the new invite code
      queryClient.setQueryData<Course>(['course', courseId], (old) => {
        if (!old) return old;
        return {
          ...old,
          inviteCode: data.code,
        };
      });
    },
  });
}
