/**
 * useEnrollCourse Hook - Course Enrollment with Optimistic Update
 * TASK-009: Enroll Course
 *
 * Handles student enrollment with optimistic UI updates.
 * REQ-FE-414: Enroll Button (Public)
 * REQ-FE-440: Optimistic Updates
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { enrollInCourse } from '~/lib/supabase/courses';
import { toast } from 'sonner';
import type { Course } from '@shared';

interface EnrollCourseVariables {
  courseId: string;
}

interface EnrollCourseContext {
  previous: Course | undefined;
}

/**
 * Hook for enrolling in a course with optimistic update
 *
 * @returns UseMutationResult for enrollment mutation
 */
export function useEnrollCourse(): UseMutationResult<void, Error, EnrollCourseVariables, EnrollCourseContext> {
  const queryClient = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  return useMutation<void, Error, EnrollCourseVariables, EnrollCourseContext>({
    mutationFn: async ({ courseId }: EnrollCourseVariables): Promise<void> => {
      await enrollInCourse(courseId);
    },

    onMutate: async ({ courseId }: EnrollCourseVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['course', courseId] });

      // Snapshot the previous value
      const previous = queryClient.getQueryData<Course>(['course', courseId]);

      // Optimistically update to the new value
      if (previous) {
        queryClient.setQueryData<Course>(['course', courseId], {
          ...previous,
          enrolledCount: previous.enrolledCount + 1,
        });
      }

      // Return context with the previous value
      return { previous };
    },

    onError: (_error: Error, { courseId }: EnrollCourseVariables, context: EnrollCourseContext | undefined) => {
      // If we have a previous value, roll back
      if (context?.previous) {
        queryClient.setQueryData(['course', courseId], context.previous);
      }

      // Show error toast
      toast.error('Enrollment failed. Please try again.');
    },

    onSettled: (_data, _error, { courseId }: EnrollCourseVariables) => {
      // Always refetch after error or success to ensure cache is in sync
      void queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
}
