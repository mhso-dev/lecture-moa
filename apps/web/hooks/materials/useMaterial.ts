"use client";

import { useQuery } from "@tanstack/react-query";
import type { Material, MaterialsQueryParams } from "@shared";
import {
  fetchMaterial,
  toMaterial,
} from "~/lib/supabase/materials";

/**
 * Query key factory for materials
 */
export const materialKeys = {
  all: (courseId: string) => ["materials", courseId] as const,
  lists: (courseId: string) => [...materialKeys.all(courseId), "list"] as const,
  list: (courseId: string, params?: MaterialsQueryParams) =>
    [...materialKeys.lists(courseId), params] as const,
  details: (courseId: string) => [...materialKeys.all(courseId), "detail"] as const,
  detail: (courseId: string, materialId: string) =>
    [...materialKeys.details(courseId), materialId] as const,
};

/**
 * useMaterial Hook
 * REQ-FE-362: Fetch single material with full content (via Supabase direct query)
 *
 * @param courseId - The course ID
 * @param materialId - The material ID
 * @returns TanStack Query result with Material data
 *
 * @example
 * ```tsx
 * const { data: material, isLoading, error } = useMaterial(courseId, materialId);
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <ErrorState />;
 * return <MarkdownRenderer content={material.content} />;
 * ```
 */
export function useMaterial(courseId: string, materialId: string) {
  return useQuery<Material>({
    queryKey: materialKeys.detail(courseId, materialId),
    queryFn: async () => {
      const row = await fetchMaterial(courseId, materialId);
      return toMaterial(row);
    },
    enabled: !!courseId && !!materialId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
