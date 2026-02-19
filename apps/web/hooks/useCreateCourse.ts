/**
 * useCreateCourse Hook - Create New Course
 * TASK-011: Create Course
 *
 * Handles course creation for instructors.
 * REQ-FE-421: Course Creation Form
 * REQ-FE-424: Successful Creation Redirect
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
import type { CreateCoursePayload, Course } from '@shared';

/**
 * Hook for creating a new course
 *
 * @returns UseMutationResult with created course data including ID for redirect
 */
export function useCreateCourse(): UseMutationResult<Course, Error, CreateCoursePayload> {
  const queryClient = useQueryClient();

  return useMutation<Course, Error, CreateCoursePayload>({
    mutationFn: async (payload: CreateCoursePayload) => {
      const response = await api.post<Course>('/api/v1/courses', payload);
      return response.data;
    },

    onSuccess: () => {
      // Invalidate courses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
