/**
 * useQAList Hook - Paginated Q&A List Query
 * TASK-005: TanStack Query hook for paginated Q&A list
 * REQ-FE-503: Q&A API hook definitions
 * REQ-BE-004-010: Supabase query layer migration
 *
 * Provides infinite query support for Q&A list with filter support.
 * Uses useInfiniteQuery for pagination with "Load More" pattern.
 */

import { useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { getQuestions } from '~/lib/supabase/qa';
import { qaKeys } from './qa-keys';
import type { QAListFilter, QAListItem } from '@shared';

/**
 * Parameters for useQAList hook
 */
export type UseQAListParams = Omit<QAListFilter, 'page'>;

/**
 * Response type for QA list query (Supabase query layer format)
 */
export type QAListResponse = { data: QAListItem[]; nextPage: number | null; total: number };

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
): UseInfiniteQueryResult<QAListResponse> {
  return useInfiniteQuery({
    queryKey: qaKeys.list(filter),
    queryFn: async ({ pageParam }): Promise<QAListResponse> => {
      return getQuestions({
        ...filter,
        page: pageParam,
        limit: filter.limit ?? 20,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    staleTime: 30 * 1000, // 30 seconds
  });
}
