"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Material } from "@shared";
import { toggleMaterialStatus } from "~/lib/api/materials";
import { materialKeys } from "./useMaterial";

/**
 * useToggleMaterialStatus Hook
 * REQ-FE-362: Mutation for publish/unpublish toggle
 *
 * @param courseId - The course ID
 * @returns TanStack mutation for toggling material status
 *
 * @example
 * ```tsx
 * const toggleMutation = useToggleMaterialStatus(courseId);
 *
 * const handleToggle = (materialId: string) => {
 *   toggleMutation.mutate(materialId, {
 *     onSuccess: (material) => {
 *       toast.success(
 *         material.status === 'published'
 *           ? "Material published"
 *           : "Material unpublished"
 *       );
 *     }
 *   });
 * };
 * ```
 */
export function useToggleMaterialStatus(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation<Material, Error, string>({
    mutationFn: (materialId: string) => toggleMaterialStatus(courseId, materialId),
    onSuccess: (updatedMaterial, materialId) => {
      // Update the cached material detail
      queryClient.setQueryData(
        materialKeys.detail(courseId, materialId),
        updatedMaterial
      );

      // Invalidate materials list to reflect status change
      queryClient.invalidateQueries({
        queryKey: materialKeys.lists(courseId),
      });
    },
  });
}
