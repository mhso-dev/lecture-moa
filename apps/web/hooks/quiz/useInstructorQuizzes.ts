/**
 * useInstructorQuizzes Hook - Instructor Quiz List
 * REQ-BE-005-011: Instructor quiz list fetching with pagination and filtering
 *
 * Fetches paginated list of quizzes created by the instructor.
 * Includes drafts and all statuses visible to instructors.
 * Data source: Supabase direct query (migrated from REST API).
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  getInstructorQuizzes,
  type InstructorQuizParams,
  type PaginatedQuizList,
} from "~/lib/supabase/quizzes";

/**
 * Query key factory for instructor quizzes
 */
export const instructorQuizKeys = {
  all: ["instructor", "quizzes"] as const,
  lists: () => [...instructorQuizKeys.all, "list"] as const,
  list: (params?: InstructorQuizParams) => [...instructorQuizKeys.lists(), params] as const,
  detail: (quizId: string) => [...instructorQuizKeys.all, quizId] as const,
};

/**
 * Fetch paginated instructor quiz list
 *
 * @param params - Query parameters for filtering and pagination
 * @returns UseQueryResult with paginated quiz list data
 *
 * Query Key: ['instructor', 'quizzes', params]
 *
 * Features:
 * - Filters by status and courseId
 * - Page-based pagination via Supabase .range()
 * - Includes draft quizzes (all statuses)
 * - Automatic caching
 */
export function useInstructorQuizzes(
  params?: InstructorQuizParams
): UseQueryResult<PaginatedQuizList> {
  return useQuery({
    queryKey: ["instructor", "quizzes", params],
    queryFn: () => getInstructorQuizzes(params),
  });
}
