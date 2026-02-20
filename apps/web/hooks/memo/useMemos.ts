"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type {
  Memo,
  MemoFilterParams,
  PaginatedResponse,
} from "@shared";
import { api } from "~/lib/api";

/**
 * Query key factory for memos
 * REQ-FE-787: Query keys for memo list queries
 */
export const memoKeys = {
  all: ["memos"] as const,
  lists: () => [...memoKeys.all, "list"] as const,
  personalList: (filters: MemoFilterParams) =>
    [...memoKeys.lists(), "personal", filters] as const,
  teamList: (teamId: string) =>
    [...memoKeys.lists(), "team", { teamId }] as const,
  details: () => [...memoKeys.all, "detail"] as const,
  detail: (memoId: string) => [...memoKeys.details(), memoId] as const,
};

/**
 * Build query string from filter params
 */
function buildFilterParams(filters: MemoFilterParams): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};

  if (filters.visibility) params.visibility = filters.visibility;
  if (filters.teamId) params.teamId = filters.teamId;
  if (filters.materialId) params.materialId = filters.materialId;
  if (filters.tags && filters.tags.length > 0) {
    // Tags are passed as comma-separated string for URL params
    params.tags = filters.tags.join(",");
  }
  if (filters.isDraft !== undefined) params.isDraft = filters.isDraft;
  if (filters.search) params.search = filters.search;

  return params;
}

/**
 * Fetch personal memos with filters
 * REQ-FE-787: GET /api/v1/memos/?visibility=personal&...filters
 */
async function fetchPersonalMemos(
  filters: MemoFilterParams,
  pageParam: number = 1
): Promise<PaginatedResponse<Memo>> {
  const params: Record<string, string | number | boolean> = {
    ...buildFilterParams(filters),
    visibility: "personal",
    page: pageParam,
    limit: 20,
  };

  const response = await api.get<PaginatedResponse<Memo>>("/api/v1/memos/", {
    params,
  });
  return response.data;
}

/**
 * Fetch team memos
 * REQ-FE-787: GET /api/v1/memos/?teamId={teamId}
 */
async function fetchTeamMemos(
  teamId: string,
  pageParam: number = 1
): Promise<PaginatedResponse<Memo>> {
  const response = await api.get<PaginatedResponse<Memo>>("/api/v1/memos/", {
    params: {
      teamId,
      page: pageParam,
      limit: 20,
    },
  });
  return response.data;
}

/**
 * usePersonalMemos Hook
 * REQ-FE-787: Fetches personal memos with filtering and infinite scroll
 *
 * @param filters - Filter parameters for memo list
 * @returns TanStack InfiniteQuery result with paginated Memo data
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage
 * } = usePersonalMemos({ search: "react", tags: ["frontend"] });
 *
 * const memos = data?.pages.flatMap(page => page.data) ?? [];
 *
 * return (
 *   <>
 *     <MemoList memos={memos} />
 *     {hasNextPage && (
 *       <Button onClick={fetchNextPage} loading={isFetchingNextPage}>
 *         Load More
 *       </Button>
 *     )}
 *   </>
 * );
 * ```
 */
export function usePersonalMemos(filters: MemoFilterParams = {}) {
  return useInfiniteQuery<PaginatedResponse<Memo>, Error>({
    queryKey: memoKeys.personalList(filters),
    queryFn: ({ pageParam = 1 }) => fetchPersonalMemos(filters, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * useTeamMemos Hook
 * REQ-FE-787: Fetches team memos with infinite scroll
 *
 * @param teamId - The team ID
 * @returns TanStack InfiniteQuery result with paginated Memo data
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage
 * } = useTeamMemos(teamId);
 *
 * const memos = data?.pages.flatMap(page => page.data) ?? [];
 *
 * return (
 *   <InfiniteScroll
 *     data={memos}
 *     onLoadMore={fetchNextPage}
 *     hasMore={hasNextPage}
 *     loading={isFetchingNextPage}
 *   >
 *     {(memo) => <MemoCard key={memo.id} memo={memo} />}
 *   </InfiniteScroll>
 * );
 * ```
 */
export function useTeamMemos(teamId: string) {
  return useInfiniteQuery<PaginatedResponse<Memo>, Error>({
    queryKey: memoKeys.teamList(teamId),
    queryFn: ({ pageParam = 1 }) => fetchTeamMemos(teamId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!teamId,
    staleTime: 30 * 1000, // 30 seconds (team memos are more collaborative)
  });
}
