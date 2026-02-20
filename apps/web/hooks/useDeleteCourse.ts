/**
 * useDeleteCourse Hook - Delete Course
 * TASK-014: Delete Course
 *
 * Handles course deletion for instructors.
 * REQ-FE-437: Delete Course
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { deleteCourse } from '~/lib/supabase/courses';

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

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  return useMutation<void, Error, DeleteCourseVariables>({
    mutationFn: ({ courseId }: DeleteCourseVariables): Promise<void> =>
      deleteCourse(courseId),

    onSuccess: () => {
      // Invalidate courses query to refresh the list
      void queryClient.invalidateQueries({ queryKey: ['courses'] });

      // Redirect to courses list page
      router.push('/courses');
    },
  });
}
