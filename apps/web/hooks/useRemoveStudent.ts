/**
 * useRemoveStudent Hook - Remove Student from Course
 * TASK-016: Remove Student
 *
 * Handles removing students from courses (instructor only).
 * REQ-FE-435: Remove Student
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { removeStudent } from '~/lib/supabase/courses';

interface RemoveStudentVariables {
  courseId: string;
  userId: string;
}

/**
 * Hook for removing a student from a course
 *
 * @returns UseMutationResult for remove student mutation
 */
export function useRemoveStudent(): UseMutationResult<void, Error, RemoveStudentVariables> {
  const queryClient = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  return useMutation<void, Error, RemoveStudentVariables>({
    mutationFn: ({ courseId, userId }: RemoveStudentVariables): Promise<void> =>
      removeStudent(courseId, userId),

    onSuccess: (_data, { courseId }: RemoveStudentVariables) => {
      // Invalidate students query to refresh the roster
      void queryClient.invalidateQueries({ queryKey: ['course', courseId, 'students'] });
    },
  });
}
