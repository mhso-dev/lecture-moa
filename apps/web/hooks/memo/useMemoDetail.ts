"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Memo,
  MemoDetailResponse,
  CreateMemoRequest,
  UpdateMemoRequest,
} from "@shared";
import { useAuth } from "~/hooks/useAuth";
import {
  fetchMemoDetail,
  createMemo,
  updateMemo,
  deleteMemo,
} from "~/lib/supabase/memos";
import { memoKeys } from "./useMemos";

/**
 * useMemoDetail Hook
 * REQ-BE-006-034: Fetches single memo with link target via Supabase
 *
 * @param memoId - The memo ID
 * @returns TanStack Query result with MemoDetailResponse
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMemoDetail(memoId);
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <NotFound />;
 *
 * const { memo, linkTarget } = data;
 * return (
 *   <>
 *     {linkTarget && <MaterialLinkCard target={linkTarget} />}
 *     <MarkdownRenderer content={memo.content} />
 *   </>
 * );
 * ```
 */
export function useMemoDetail(memoId: string) {
  return useQuery<MemoDetailResponse>({
    queryKey: memoKeys.detail(memoId),
    queryFn: () => fetchMemoDetail(memoId),
    enabled: !!memoId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * useCreateMemo Hook
 * REQ-BE-006-035: Mutation for creating a new memo via Supabase
 *
 * @returns TanStack mutation for memo creation
 *
 * @example
 * ```tsx
 * const createMutation = useCreateMemo();
 *
 * createMutation.mutate(
 *   {
 *     title: "React Notes",
 *     content: "# React\n\n...",
 *     visibility: "personal",
 *     tags: ["react", "frontend"]
 *   },
 *   {
 *     onSuccess: (memo) => {
 *       toast.success("Memo created");
 *       router.push(`/memos/${memo.id}`);
 *     },
 *     onError: (error) => {
 *       toast.error("Failed to create memo");
 *     }
 *   }
 * );
 * ```
 */
export function useCreateMemo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Memo, Error, CreateMemoRequest>({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- user existence guaranteed before mutate call
    mutationFn: (data) => createMemo(data, user!.id),
    onSuccess: (newMemo) => {
      // Invalidate memo lists to refetch
      void queryClient.invalidateQueries({
        queryKey: memoKeys.lists(),
      });

      // If team memo, also invalidate team-specific list
      if (newMemo.teamId) {
        void queryClient.invalidateQueries({
          queryKey: memoKeys.teamList(newMemo.teamId),
        });
      }
    },
  });
}

/**
 * useUpdateMemo Hook
 * REQ-BE-006-036: Mutation for updating an existing memo via Supabase
 *
 * @param memoId - The memo ID to update
 * @returns TanStack mutation for memo update
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateMemo(memoId);
 *
 * updateMutation.mutate(
 *   {
 *     title: "Updated Title",
 *     content: "Updated content...",
 *     tags: ["updated"]
 *   },
 *   {
 *     onSuccess: (memo) => {
 *       toast.success("Memo saved");
 *       queryClient.setQueryData(memoKeys.detail(memoId), { memo });
 *     },
 *     onError: () => {
 *       toast.error("Failed to save memo");
 *     }
 *   }
 * );
 * ```
 */
export function useUpdateMemo(memoId: string) {
  const queryClient = useQueryClient();

  return useMutation<Memo, Error, UpdateMemoRequest>({
    mutationFn: (data) => updateMemo(memoId, data),
    onSuccess: (updatedMemo) => {
      // Update the detail cache
      queryClient.setQueryData(memoKeys.detail(memoId), (old: MemoDetailResponse | undefined) => {
        if (old) {
          return { ...old, memo: updatedMemo };
        }
        return old;
      });

      // Invalidate lists to ensure consistency
      void queryClient.invalidateQueries({
        queryKey: memoKeys.lists(),
      });

      // If team memo changed, invalidate team list
      if (updatedMemo.teamId) {
        void queryClient.invalidateQueries({
          queryKey: memoKeys.teamList(updatedMemo.teamId),
        });
      }
    },
  });
}

/**
 * useDeleteMemo Hook
 * REQ-BE-006-037: Mutation for deleting a memo via Supabase
 *
 * @returns TanStack mutation for memo deletion
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteMemo();
 *
 * deleteMutation.mutate(memoId, {
 *   onSuccess: () => {
 *     toast.success("Memo deleted");
 *     router.push("/memos");
 *   },
 *   onError: () => {
 *     toast.error("Failed to delete memo");
 *   }
 * });
 * ```
 */
export function useDeleteMemo() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: deleteMemo,
    onSuccess: (_, deletedMemoId) => {
      // Remove from detail cache
      queryClient.removeQueries({
        queryKey: memoKeys.detail(deletedMemoId),
      });

      // Invalidate all lists
      void queryClient.invalidateQueries({
        queryKey: memoKeys.lists(),
      });
    },
  });
}
