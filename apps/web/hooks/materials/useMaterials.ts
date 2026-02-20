"use client";

import { useQuery } from "@tanstack/react-query";
import type { MaterialListItem, MaterialsQueryParams, PaginatedResponse } from "@shared";
import {
  fetchMaterials,
  toMaterialListItem,
} from "~/lib/supabase/materials";
import { materialKeys } from "./useMaterial";

/**
 * useMaterials Hook
 * REQ-FE-362: Fetch paginated material list (via Supabase direct query)
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
 * const totalPages = data?.pagination.totalPages ?? 0;
 * ```
 */
export function useMaterials(
  courseId: string,
  params?: MaterialsQueryParams
) {
  return useQuery<PaginatedResponse<MaterialListItem>>({
    queryKey: materialKeys.list(courseId, params),
    queryFn: async () => {
      const { data, count } = await fetchMaterials(courseId, params);
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      const total = count;
      const totalPages = Math.ceil(total / limit);

      return {
        data: data.map(toMaterialListItem),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    },
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
