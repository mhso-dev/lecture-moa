"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMaterial } from "~/lib/api/materials";
import { materialKeys } from "./useMaterial";

/**
 * useDeleteMaterial Hook
 * REQ-FE-362: Mutation for material deletion
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

  return useMutation<void, Error, string>({
    mutationFn: (materialId: string) => deleteMaterial(courseId, materialId),
    onSuccess: (_, materialId) => {
      // Remove the material from cache
      queryClient.removeQueries({
        queryKey: materialKeys.detail(courseId, materialId),
      });

      // Invalidate materials list
      queryClient.invalidateQueries({
        queryKey: materialKeys.lists(courseId),
      });
    },
  });
}
