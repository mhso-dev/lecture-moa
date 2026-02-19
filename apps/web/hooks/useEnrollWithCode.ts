/**
 * useEnrollWithCode Hook - Enroll via Invite Code
 * TASK-010: Enroll with Invite Code
 *
 * Handles student enrollment using a 6-character invite code.
 * REQ-FE-415: Join via Invite Code
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
import type { EnrollWithCodePayload } from '@shared';

interface EnrollWithCodeVariables {
  courseId: string;
  code: string;
}

/**
 * Validates that the code is exactly 6 characters
 */
function validateCode(code: string): Error | null {
  if (!code || code.length === 0) {
    return new Error('Invite code is required');
  }
  if (code.length !== 6) {
    return new Error('Invite code must be exactly 6 characters');
  }
  return null;
}

/**
 * Hook for enrolling in a course using an invite code
 *
 * @returns UseMutationResult for invite code enrollment
 */
export function useEnrollWithCode(): UseMutationResult<void, Error, EnrollWithCodeVariables> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, EnrollWithCodeVariables>({
    mutationFn: async ({ courseId, code }: EnrollWithCodeVariables) => {
      // Validate code length before calling API
      const validationError = validateCode(code);
      if (validationError) {
        throw validationError;
      }

      const payload: EnrollWithCodePayload = { code };
      await api.post(`/api/v1/courses/${courseId}/enroll/code`, payload);
    },

    onSuccess: (_data, { courseId }: EnrollWithCodeVariables) => {
      // Invalidate course query to refetch enrollment status
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}
