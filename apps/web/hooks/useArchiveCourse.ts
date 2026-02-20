/**
 * useArchiveCourse Hook - Archive Course
 * TASK-013: Archive Course
 *
 * Handles course archiving for instructors.
 * REQ-FE-436: Archive Course
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '~/lib/api';

interface ArchiveCourseVariables {
  courseId: string;
}

/**
 * Hook for archiving a course
 *
 * @returns UseMutationResult for archive mutation
 */
export function useArchiveCourse(): UseMutationResult<void, Error, ArchiveCourseVariables> {
  const queryClient = useQueryClient();
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  return useMutation<void, Error, ArchiveCourseVariables>({
    mutationFn: async ({ courseId }: ArchiveCourseVariables) => {
      await api.post(`/api/v1/courses/${courseId}/archive`);
    },

    onSuccess: () => {
      // Invalidate courses query to refresh the list
      void queryClient.invalidateQueries({ queryKey: ['courses'] });

      // Redirect to courses list page
      router.push('/courses');
    },
  });
}
