"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateMaterialDto, Material } from "@shared";
import { createMaterial } from "~/lib/api/materials";
import { materialKeys } from "./useMaterial";

/**
 * useCreateMaterial Hook
 * REQ-FE-362: Mutation for material creation
 *
 * @param courseId - The course ID
 * @returns TanStack mutation for creating materials
 *
 * @example
 * ```tsx
 * const createMutation = useCreateMaterial(courseId);
 *
 * createMutation.mutate(
 *   { title: "Intro", content: "# Hello", status: "draft" },
 *   {
 *     onSuccess: (material) => {
 *       toast.success("Material created");
 *       router.push(`/courses/${courseId}/materials/${material.id}`);
 *     },
 *     onError: (error) => {
 *       toast.error("Failed to create material");
 *     }
 *   }
 * );
 * ```
 */
export function useCreateMaterial(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation<Material, Error, CreateMaterialDto>({
    mutationFn: (dto: CreateMaterialDto) => createMaterial(courseId, dto),
    onSuccess: () => {
      // Invalidate materials list to refetch
      void queryClient.invalidateQueries({
        queryKey: materialKeys.lists(courseId),
      });
    },
  });
}
