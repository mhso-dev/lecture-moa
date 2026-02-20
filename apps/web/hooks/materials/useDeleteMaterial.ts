"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMaterial as deleteMaterialQuery } from "~/lib/supabase/materials";
import { materialKeys } from "./useMaterial";

/**
 * useDeleteMaterial Hook
 * REQ-FE-362: Mutation for material deletion (via Supabase direct query)
 *
 * @param courseId - The course ID
 * @returns TanStack mutation for deleting materials
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteMaterial(courseId);
 *
 * const handleDelete = (materialId: string) => {
 *   if (confirm("Are you sure?")) {
 *     deleteMutation.mutate(materialId, {
 *       onSuccess: () => {
 *         toast.success("Material deleted");
 *         router.push(`/courses/${courseId}/materials`);
 *       }
 *     });
 *   }
 * };
 * ```
 */
export function useDeleteMaterial(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: (materialId: string) => deleteMaterialQuery(materialId),
    onSuccess: (_, materialId) => {
      // Remove the material from cache
      queryClient.removeQueries({
        queryKey: materialKeys.detail(courseId, materialId),
      });

      // Invalidate materials list
      void queryClient.invalidateQueries({
        queryKey: materialKeys.lists(courseId),
      });
    },
  });
}
