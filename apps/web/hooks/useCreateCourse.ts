/**
 * useCreateCourse Hook - Create New Course
 * TASK-011: Create Course
 *
 * Handles course creation for instructors.
 * REQ-FE-421: Course Creation Form
 * REQ-FE-424: Successful Creation Redirect
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { createCourse } from '~/lib/supabase/courses';
import type { CreateCoursePayload, Course } from '@shared';

/**
 * Hook for creating a new course
 *
 * @returns UseMutationResult with created course data including ID for redirect
 */
export function useCreateCourse(): UseMutationResult<Course, Error, CreateCoursePayload> {
  const queryClient = useQueryClient();

  return useMutation<Course, Error, CreateCoursePayload>({
    mutationFn: (payload: CreateCoursePayload): Promise<Course> =>
      createCourse(payload),

    onSuccess: () => {
      // Invalidate courses query to refresh the list
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
