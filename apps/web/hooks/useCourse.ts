/**
 * useCourse Hook - Single Course Detail
 * TASK-006: Single Course
 *
 * Fetches detailed information for a single course by ID.
 * Handles 404 gracefully and includes full syllabus.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { Course } from "@shared";

/**
 * Fetch single course by ID
 *
 * @param courseId - The course ID to fetch
 * @returns UseQueryResult with course data
 *
 * Note: Query is disabled when courseId is empty or undefined
 * to prevent unnecessary API calls.
 */
export function useCourse(courseId: string): UseQueryResult<Course, Error> {
  return useQuery<Course, Error>({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const response = await api.get<Course>(`/api/v1/courses/${courseId}`);
      return response.data;
    },
    enabled: !!courseId && courseId.length > 0,
  });
}
