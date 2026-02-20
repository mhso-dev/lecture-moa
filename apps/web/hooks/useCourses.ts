/**
 * useCourses Hook - Course List with Pagination
 * TASK-005: List with Pagination
 *
 * Fetches paginated course list with filtering and sorting options.
 * Uses TanStack Query v5 for caching and state management.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { PaginatedCourseList, CourseListParams } from "@shared";

/**
 * Fetch course list with pagination and filters
 *
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns UseQueryResult with paginated course list data
 */
export function useCourses(
  params?: CourseListParams
): UseQueryResult<PaginatedCourseList> {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: async (): Promise<PaginatedCourseList> => {
      const response = await api.get<PaginatedCourseList>("/api/v1/courses", {
        params: params as Record<string, string | number | boolean> | undefined,
      });
      return response.data;
    },
  });
}
