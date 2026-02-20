/**
 * useCourseStudents Hook - Instructor Student List
 * TASK-008: Instructor View of Student Progress
 *
 * Fetches list of students enrolled in a course with their progress.
 * Only available for course instructors.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchCourseStudents } from "~/lib/supabase/courses";
import type { StudentProgress } from "@shared";

/**
 * Fetch student list for a course (instructor only)
 *
 * @param courseId - The course ID to fetch students for
 * @returns UseQueryResult with array of student progress data
 *
 * Note: Query is disabled when courseId is empty or undefined.
 * Returns empty array if user is not the course instructor (RLS enforced).
 */
export function useCourseStudents(
  courseId: string
): UseQueryResult<StudentProgress[]> {
  return useQuery({
    queryKey: ["course", courseId, "students"],
    queryFn: (): Promise<StudentProgress[]> => fetchCourseStudents(courseId),
    enabled: !!courseId && courseId.length > 0,
  });
}
