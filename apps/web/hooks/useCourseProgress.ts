/**
 * useCourseProgress Hook - Student Progress
 * TASK-007: Course Progress for Enrolled Students
 *
 * Fetches the current user's progress in a specific course.
 * Only available for enrolled students.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchCourseProgress } from "~/lib/supabase/courses";
import type { CourseEnrollment } from "@shared";

/**
 * Fetch course progress for the current user
 *
 * @param courseId - The course ID to fetch progress for
 * @returns UseQueryResult with enrollment and progress data
 *
 * Note: Query is disabled when courseId is empty or undefined.
 * Throws if user is not enrolled in the course.
 */
export function useCourseProgress(
  courseId: string
): UseQueryResult<CourseEnrollment> {
  return useQuery({
    queryKey: ["course", courseId, "progress"],
    queryFn: (): Promise<CourseEnrollment> => fetchCourseProgress(courseId),
    enabled: !!courseId && courseId.length > 0,
  });
}
