"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { Memo, MemoFilterParams } from "@shared";
import { useAuth } from "~/hooks/useAuth";
import {
  fetchPersonalMemos,
  fetchTeamMemos,
} from "~/lib/supabase/memos";

/** Page size for memo list pagination */
const PAGE_SIZE = 20;

/** Response shape from Supabase range-based pagination */
interface MemoPageResponse {
  data: Memo[];
  count: number;
}

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
 * usePersonalMemos Hook
 * REQ-BE-006-030/031/033: Fetches personal memos via Supabase with filtering and infinite scroll
 *
 * Uses range-based pagination with Supabase .range() instead of page-based REST pagination.
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
  const { user } = useAuth();

  return useInfiniteQuery<MemoPageResponse>({
    queryKey: memoKeys.personalList(filters),
    queryFn: ({ pageParam = 0 }) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- user existence guaranteed by enabled
      fetchPersonalMemos(user!.id, filters, {
        from: pageParam as number,
        to: (pageParam as number) + PAGE_SIZE - 1,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      return lastPage.data.length === PAGE_SIZE
        ? (lastPageParam as number) + PAGE_SIZE
        : undefined;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * useTeamMemos Hook
 * REQ-BE-006-032/033: Fetches team memos via Supabase with infinite scroll
 *
 * Uses range-based pagination with Supabase .range() instead of page-based REST pagination.
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
  return useInfiniteQuery<MemoPageResponse>({
    queryKey: memoKeys.teamList(teamId),
    queryFn: ({ pageParam = 0 }) =>
      fetchTeamMemos(teamId, {
        from: pageParam as number,
        to: (pageParam as number) + PAGE_SIZE - 1,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      return lastPage.data.length === PAGE_SIZE
        ? (lastPageParam as number) + PAGE_SIZE
        : undefined;
    },
    enabled: !!teamId,
    staleTime: 30 * 1000, // 30 seconds (team memos are more collaborative)
  });
}
