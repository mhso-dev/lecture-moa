/**
 * useDeleteCourse Hook - Delete Course
 * TASK-014: Delete Course
 *
 * Handles course deletion for instructors.
 * REQ-FE-437: Delete Course
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '~/lib/api';

interface DeleteCourseVariables {
  courseId: string;
}

/**
 * Hook for deleting a course
 *
 * @returns UseMutationResult for delete mutation
 */
export function useDeleteCourse(): UseMutationResult<void, Error, DeleteCourseVariables> {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, DeleteCourseVariables>({
    mutationFn: async ({ courseId }: DeleteCourseVariables) => {
      await api.delete(`/api/v1/courses/${courseId}`);
    },

    onSuccess: () => {
      // Invalidate courses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['courses'] });

      // Redirect to courses list page
      router.push('/courses');
    },
  });
}
