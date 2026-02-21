/**
 * useQuizList Hook - Quiz List with Pagination
 * REQ-FE-602 / REQ-BE-005-009: Quiz list fetching with pagination
 *
 * Fetches paginated quiz list with filtering options.
 * Uses TanStack Query v5 for caching and state management.
 * Data source: Supabase direct query (migrated from REST API).
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  getQuizzes,
  type QuizListParams,
  type PaginatedQuizList,
} from "~/lib/supabase/quizzes";

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
 * - Page-based pagination via Supabase .range()
 * - Automatic caching
 */
export function useQuizList(
  params?: QuizListParams
): UseQueryResult<PaginatedQuizList> {
  return useQuery({
    queryKey: ["quizzes", params],
    queryFn: () => getQuizzes(params),
  });
}
