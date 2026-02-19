"use client";

import { useQuery } from "@tanstack/react-query";
import type { MaterialListItem, MaterialsQueryParams, PaginatedResponse } from "@shared";
import { getMaterials } from "~/lib/api/materials";
import { materialKeys } from "./useMaterial";

/**
 * useMaterials Hook
 * REQ-FE-362: Fetch paginated material list
 *
 * @param courseId - The course ID
 * @param params - Query parameters (filters, sort, pagination)
 * @returns TanStack Query result with paginated material list
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMaterials(courseId, {
 *   search: "intro",
 *   sort: "createdAt",
 *   order: "desc",
 *   page: 1,
 *   limit: 20
 * });
 *
 * const materials = data?.data ?? [];
 * const totalPages = data?.meta.totalPages ?? 0;
 * ```
 */
export function useMaterials(
  courseId: string,
  params?: MaterialsQueryParams
) {
  return useQuery<PaginatedResponse<MaterialListItem>>({
    queryKey: materialKeys.list(courseId, params),
    queryFn: () => getMaterials(courseId, params),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
