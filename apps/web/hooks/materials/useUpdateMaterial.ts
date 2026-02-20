"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateMaterialDto, Material } from "@shared";
import {
  updateMaterial as updateMaterialQuery,
  toMaterial,
} from "~/lib/supabase/materials";
import { materialKeys } from "./useMaterial";

// Extended type for mutation input
type UpdateMaterialInput = { id: string } & Omit<UpdateMaterialDto, "id">;

/**
 * useUpdateMaterial Hook
 * REQ-FE-362: Mutation for material update (via Supabase direct query)
 *
 * @param courseId - The course ID
 * @returns TanStack mutation for updating materials
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateMaterial(courseId);
 *
 * updateMutation.mutate(
 *   { id: materialId, title: "Updated Title", content: newContent },
 *   {
 *     onSuccess: (material) => {
 *       toast.success("Material saved");
 *     }
 *   }
 * );
 * ```
 */
export function useUpdateMaterial(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation<Material, Error, UpdateMaterialInput>({
    mutationFn: async ({ id, ...dto }) => {
      const row = await updateMaterialQuery(id, {
        title: dto.title,
        content: dto.content,
        tags: dto.tags,
        status: dto.status,
        position: dto.position,
      });
      return toMaterial(row);
    },
    onSuccess: (updatedMaterial, variables) => {
      // Update the cached material detail
      queryClient.setQueryData(
        materialKeys.detail(courseId, variables.id),
        updatedMaterial
      );

      // Invalidate materials list
      void queryClient.invalidateQueries({
        queryKey: materialKeys.lists(courseId),
      });
    },
  });
}
