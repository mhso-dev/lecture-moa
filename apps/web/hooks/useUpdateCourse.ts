/**
 * useUpdateCourse Hook - Update Course
 * TASK-012: Update Course
 *
 * Handles course updates for instructors.
 * REQ-FE-432: Save Settings
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { updateCourse } from '~/lib/supabase/courses';
import type { UpdateCoursePayload, Course } from '@shared';

interface UpdateCourseVariables {
  courseId: string;
}

type UpdateCourseParams = UpdateCourseVariables & UpdateCoursePayload;

/**
 * Hook for updating an existing course
 *
 * @returns UseMutationResult with updated course data
 */
export function useUpdateCourse(): UseMutationResult<Course, Error, UpdateCourseParams> {
  const queryClient = useQueryClient();

  return useMutation<Course, Error, UpdateCourseParams>({
    mutationFn: ({ courseId, ...payload }: UpdateCourseParams): Promise<Course> =>
      updateCourse(courseId, payload),

    onSuccess: (_data, { courseId }: UpdateCourseParams) => {
      // Invalidate both the specific course and the course list
      void queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
