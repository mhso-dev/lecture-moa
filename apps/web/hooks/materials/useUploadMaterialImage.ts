"use client";

import { useMutation } from "@tanstack/react-query";
import { uploadMaterialImage } from "~/lib/supabase/storage";

interface UploadInput {
  materialId: string;
  file: File;
}

interface UploadResult {
  url: string;
}

/**
 * useUploadMaterialImage Hook
 * REQ-FE-362: Mutation for image upload within editor (via Supabase Storage)
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
 *     uploadMutation.mutate(
 *       { materialId, file },
 *       {
 *         onSuccess: ({ url }) => {
 *           editor.insertText(`![image](${url})`);
 *         }
 *       }
 *     );
 *   }
 * };
 * ```
 */
export function useUploadMaterialImage(courseId: string) {
  return useMutation<UploadResult, Error, UploadInput>({
    mutationFn: async ({ materialId, file }) => {
      const url = await uploadMaterialImage(courseId, materialId, file);
      return { url };
    },
  });
}
