/**
 * useCourse Hook - Single Course Detail
 * TASK-006: Single Course
 *
 * Fetches detailed information for a single course by ID.
 * Handles 404 gracefully and includes full syllabus.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchCourse } from "~/lib/supabase/courses";
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
export function useCourse(courseId: string): UseQueryResult<Course> {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: (): Promise<Course> => fetchCourse(courseId),
    enabled: !!courseId && courseId.length > 0,
  });
}
