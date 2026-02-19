/**
 * useUpdateCourse Hook - Update Course
 * TASK-012: Update Course
 *
 * Handles course updates for instructors.
 * REQ-FE-432: Save Settings
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
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
    mutationFn: async ({ courseId, ...payload }: UpdateCourseParams) => {
      const response = await api.patch<Course>(`/api/v1/courses/${courseId}`, payload);
      return response.data;
    },

    onSuccess: (_data, { courseId }: UpdateCourseParams) => {
      // Invalidate both the specific course and the course list
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
