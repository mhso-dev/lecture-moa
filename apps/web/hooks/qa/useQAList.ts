/**
 * useQAList Hook - Paginated Q&A List Query
 * TASK-005: TanStack Query hook for paginated Q&A list
 * REQ-FE-503: Q&A API hook definitions
 *
 * Provides infinite query support for Q&A list with filter support.
 * Uses useInfiniteQuery for pagination with "Load More" pattern.
 */

import { useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { qaKeys } from './qa-keys';
import type { PaginatedResponse, QAListFilter, QAListItem } from '@shared';

/**
 * Parameters for useQAList hook
 */
export interface UseQAListParams extends Omit<QAListFilter, 'page'> {}

/**
 * Response type for QA list query
 */
export type QAListResponse = PaginatedResponse<QAListItem>;

/**
 * Hook for fetching paginated Q&A list with filter support
 *
 * @param filter - Filter parameters (courseId, materialId, status, q, sort, limit)
 * @returns UseInfiniteQueryResult with paginated Q&A list data
 *
 * @example
 * ```tsx
 * const { data, isLoading, fetchNextPage, hasNextPage } = useQAList({
 *   courseId: 'course-123',
 *   status: 'OPEN',
 *   sort: 'newest',
 *   limit: 20,
 * });
 *
 * // Access all items across pages
 * const questions = data?.pages.flatMap(page => page.data) ?? [];
 *
 * // Load more
 * if (hasNextPage) {
 *   fetchNextPage();
 * }
 * ```
 */
export function useQAList(
  filter: UseQAListParams
): UseInfiniteQueryResult<QAListResponse, Error> {
  return useInfiniteQuery({
    queryKey: qaKeys.list(filter),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get<QAListResponse>('/api/v1/qa/questions', {
        params: {
          ...filter,
          page: pageParam,
        },
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
