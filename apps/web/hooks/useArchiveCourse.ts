/**
 * useArchiveCourse Hook - Archive Course
 * TASK-013: Archive Course
 *
 * Handles course archiving for instructors.
 * REQ-FE-436: Archive Course
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { archiveCourse } from '~/lib/supabase/courses';
import type { Course } from '@shared';

interface ArchiveCourseVariables {
  courseId: string;
}

/**
 * Hook for archiving a course
 *
 * @returns UseMutationResult for archive mutation
 */
export function useArchiveCourse(): UseMutationResult<Course, Error, ArchiveCourseVariables> {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<Course, Error, ArchiveCourseVariables>({
    mutationFn: ({ courseId }: ArchiveCourseVariables): Promise<Course> =>
      archiveCourse(courseId),

    onSuccess: (_data, { courseId }: ArchiveCourseVariables) => {
      // Invalidate both the specific course and the course list
      void queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['courses'] });

      // Redirect to courses list page
      router.push('/courses');
    },
  });
}
