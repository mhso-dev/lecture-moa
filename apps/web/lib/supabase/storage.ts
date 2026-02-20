import { createClient } from "./client";

// Bucket names
const BUCKET_COURSE_IMAGES = "course-images";
const BUCKET_MATERIAL_IMAGES = "material-images";

// File size limits in bytes
const MAX_COURSE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_MATERIAL_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Sanitizes a filename by replacing non-alphanumeric characters (except dots and hyphens)
 * with hyphens and converting to lowercase.
 */
function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Generates a unique filename to avoid conflicts.
 * Format: {timestamp}-{sanitizedOriginalName}
 */
function generateUniqueFilename(originalName: string): string {
  const sanitized = sanitizeFilename(originalName);
  return `${Date.now().toString()}-${sanitized}`;
}

/**
 * Infers the MIME content type from a file extension.
 */
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentTypeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
  };
  return contentTypeMap[ext] ?? "application/octet-stream";
}

/**
 * Uploads a course cover image to the course-images bucket.
 * Storage path: course-images/{courseId}/{filename}
 *
 * @param courseId - The course ID used as a directory prefix
 * @param file - The image file to upload (max 5MB)
 * @returns The public URL of the uploaded image
 * @throws Error if the upload fails or the file exceeds the size limit
 */
export async function uploadCourseImage(
  courseId: string,
  file: File,
): Promise<string> {
  if (file.size > MAX_COURSE_IMAGE_SIZE) {
    throw new Error(
      `File size exceeds the 5MB limit for course images. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  const supabase = createClient();
  const uniqueFilename = generateUniqueFilename(file.name);
  const path = `${courseId}/${uniqueFilename}`;

  const { error } = await supabase.storage
    .from(BUCKET_COURSE_IMAGES)
    .upload(path, file, {
      contentType: getContentType(file.name),
      upsert: true,
    });

  if (error) {
    throw new Error(
      `Failed to upload course image to ${BUCKET_COURSE_IMAGES}/${path}: ${error.message}`,
    );
  }

  return getStoragePublicUrl(BUCKET_COURSE_IMAGES, path);
}

/**
 * Deletes a course cover image from the course-images bucket.
 * Storage path: course-images/{courseId}/{filename}
 *
 * @param courseId - The course ID used as a directory prefix
 * @param filename - The filename of the image to delete
 * @throws Error if the deletion fails
 */
export async function deleteCourseImage(
  courseId: string,
  filename: string,
): Promise<void> {
  const supabase = createClient();
  const path = `${courseId}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET_COURSE_IMAGES)
    .remove([path]);

  if (error) {
    throw new Error(
      `Failed to delete course image at ${BUCKET_COURSE_IMAGES}/${path}: ${error.message}`,
    );
  }
}

/**
 * Uploads an image embedded in a lecture material (inline markdown images)
 * to the material-images bucket.
 * Storage path: material-images/{courseId}/{materialId}/{filename}
 *
 * @param courseId - The course ID used as a directory prefix
 * @param materialId - The material ID used as a subdirectory prefix
 * @param file - The image file to upload (max 10MB)
 * @returns The public URL of the uploaded image
 * @throws Error if the upload fails or the file exceeds the size limit
 */
export async function uploadMaterialImage(
  courseId: string,
  materialId: string,
  file: File,
): Promise<string> {
  if (file.size > MAX_MATERIAL_IMAGE_SIZE) {
    throw new Error(
      `File size exceeds the 10MB limit for material images. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  const supabase = createClient();
  const uniqueFilename = generateUniqueFilename(file.name);
  const path = `${courseId}/${materialId}/${uniqueFilename}`;

  const { error } = await supabase.storage
    .from(BUCKET_MATERIAL_IMAGES)
    .upload(path, file, {
      contentType: getContentType(file.name),
      upsert: true,
    });

  if (error) {
    throw new Error(
      `Failed to upload material image to ${BUCKET_MATERIAL_IMAGES}/${path}: ${error.message}`,
    );
  }

  return getStoragePublicUrl(BUCKET_MATERIAL_IMAGES, path);
}

/**
 * Deletes an image embedded in a lecture material from the material-images bucket.
 * Storage path: material-images/{courseId}/{materialId}/{filename}
 *
 * @param courseId - The course ID used as a directory prefix
 * @param materialId - The material ID used as a subdirectory prefix
 * @param filename - The filename of the image to delete
 * @throws Error if the deletion fails
 */
export async function deleteMaterialImage(
  courseId: string,
  materialId: string,
  filename: string,
): Promise<void> {
  const supabase = createClient();
  const path = `${courseId}/${materialId}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET_MATERIAL_IMAGES)
    .remove([path]);

  if (error) {
    throw new Error(
      `Failed to delete material image at ${BUCKET_MATERIAL_IMAGES}/${path}: ${error.message}`,
    );
  }
}

/**
 * Returns the public URL for a file stored in a Supabase Storage bucket.
 * This is a synchronous helper that constructs the URL without making a network request.
 *
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns The public URL string
 */
export function getStoragePublicUrl(bucket: string, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
