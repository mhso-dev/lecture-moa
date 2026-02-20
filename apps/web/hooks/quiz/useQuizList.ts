/**
 * useQuizList Hook - Quiz List with Pagination
 * REQ-FE-602: Quiz list fetching with pagination
 *
 * Fetches paginated quiz list with filtering options.
 * Uses TanStack Query v5 for caching and state management.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchQuizList, type QuizListParams } from "~/lib/api/quiz.api";
import type { PaginatedResponse, QuizListItem } from "@shared";

/**
 * Query key factory for quiz list
 */
export const quizListKeys = {
  all: ["quizzes"] as const,
  lists: () => [...quizListKeys.all, "list"] as const,
  list: (params?: QuizListParams) => [...quizListKeys.lists(), params] as const,
};

/**
 * Fetch paginated quiz list for students
 *
 * @param params - Query parameters for filtering and pagination
 * @returns UseQueryResult with paginated quiz list data
 *
 * Query Key: ['quizzes', params]
 *
 * Features:
 * - Filters by status and courseId
 * - Cursor-based pagination
 * - Automatic caching
 */
export function useQuizList(
  params?: QuizListParams
): UseQueryResult<PaginatedResponse<QuizListItem>> {
  return useQuery({
    queryKey: ["quizzes", params],
    queryFn: () => fetchQuizList(params),
  });
}
