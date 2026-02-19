"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Memo,
  MemoDetailResponse,
  CreateMemoRequest,
  UpdateMemoRequest,
} from "@shared";
import { api } from "~/lib/api";
import { memoKeys } from "./useMemos";

/**
 * Fetch single memo detail
 * REQ-FE-788: GET /api/v1/memos/{memoId}
 */
async function fetchMemoDetail(memoId: string): Promise<MemoDetailResponse> {
  const response = await api.get<MemoDetailResponse>(`/api/v1/memos/${memoId}`);
  return response.data;
}

/**
 * Create memo
 * REQ-FE-788: POST /api/v1/memos/
 */
async function createMemo(data: CreateMemoRequest): Promise<Memo> {
  const response = await api.post<Memo>("/api/v1/memos/", data);
  return response.data;
}

/**
 * Update memo
 * REQ-FE-788: PATCH /api/v1/memos/{memoId}
 */
async function updateMemo(memoId: string, data: UpdateMemoRequest): Promise<Memo> {
  const response = await api.patch<Memo>(`/api/v1/memos/${memoId}`, data);
  return response.data;
}

/**
 * Delete memo
 * REQ-FE-788: DELETE /api/v1/memos/{memoId}
 */
async function deleteMemo(memoId: string): Promise<void> {
  await api.delete<void>(`/api/v1/memos/${memoId}`);
}

/**
 * useMemoDetail Hook
 * REQ-FE-788: Fetches single memo with link target
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
  return useQuery<MemoDetailResponse, Error>({
    queryKey: memoKeys.detail(memoId),
    queryFn: () => fetchMemoDetail(memoId),
    enabled: !!memoId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * useCreateMemo Hook
 * REQ-FE-788: Mutation for creating a new memo
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
  const queryClient = useQueryClient();

  return useMutation<Memo, Error, CreateMemoRequest>({
    mutationFn: createMemo,
    onSuccess: (newMemo) => {
      // Invalidate memo lists to refetch
      queryClient.invalidateQueries({
        queryKey: memoKeys.lists(),
      });

      // If team memo, also invalidate team-specific list
      if (newMemo.teamId) {
        queryClient.invalidateQueries({
          queryKey: memoKeys.teamList(newMemo.teamId),
        });
      }
    },
  });
}

/**
 * useUpdateMemo Hook
 * REQ-FE-788: Mutation for updating an existing memo
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
      queryClient.invalidateQueries({
        queryKey: memoKeys.lists(),
      });

      // If team memo changed, invalidate team list
      if (updatedMemo.teamId) {
        queryClient.invalidateQueries({
          queryKey: memoKeys.teamList(updatedMemo.teamId),
        });
      }
    },
  });
}

/**
 * useDeleteMemo Hook
 * REQ-FE-788: Mutation for deleting a memo
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

  return useMutation<void, Error, string>({
    mutationFn: deleteMemo,
    onSuccess: (_, deletedMemoId) => {
      // Remove from detail cache
      queryClient.removeQueries({
        queryKey: memoKeys.detail(deletedMemoId),
      });

      // Invalidate all lists
      queryClient.invalidateQueries({
        queryKey: memoKeys.lists(),
      });
    },
  });
}
