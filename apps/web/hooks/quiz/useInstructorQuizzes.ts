/**
 * useInstructorQuizzes Hook - Instructor Quiz List
 * Instructor quiz list fetching with pagination and filtering
 *
 * Fetches paginated list of quizzes created by the instructor.
 * Includes drafts and all statuses visible to instructors.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchInstructorQuizzes, type QuizListParams } from "~/lib/api/quiz.api";
import type { PaginatedResponse, QuizListItem } from "@shared";

/**
 * Query key factory for instructor quizzes
 */
export const instructorQuizKeys = {
  all: ["instructor", "quizzes"] as const,
  lists: () => [...instructorQuizKeys.all, "list"] as const,
  list: (params?: QuizListParams) => [...instructorQuizKeys.lists(), params] as const,
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
 * - Cursor-based pagination
 * - Includes draft quizzes
 * - Automatic caching
 */
export function useInstructorQuizzes(
  params?: QuizListParams
): UseQueryResult<PaginatedResponse<QuizListItem>> {
  return useQuery({
    queryKey: ["instructor", "quizzes", params],
    queryFn: () => fetchInstructorQuizzes(params),
  });
}
