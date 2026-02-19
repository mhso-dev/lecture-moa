"use client";

import { useMutation } from "@tanstack/react-query";
import { uploadMaterialImage } from "~/lib/api/materials";

interface UploadResult {
  url: string;
}

/**
 * useUploadMaterialImage Hook
 * REQ-FE-362: Mutation for image upload within editor
 *
 * @param courseId - The course ID
 * @returns TanStack mutation for uploading images
 *
 * @example
 * ```tsx
 * const uploadMutation = useUploadMaterialImage(courseId);
 *
 * const handlePaste = async (e: ClipboardEvent) => {
 *   const file = e.clipboardData?.files[0];
 *   if (file?.type.startsWith('image/')) {
 *     uploadMutation.mutate(file, {
 *       onSuccess: ({ url }) => {
 *         editor.insertText(`![image](${url})`);
 *       }
 *     });
 *   }
 * };
 * ```
 */
export function useUploadMaterialImage(courseId: string) {
  return useMutation<UploadResult, Error, File>({
    mutationFn: (file: File) => uploadMaterialImage(courseId, file),
  });
}
