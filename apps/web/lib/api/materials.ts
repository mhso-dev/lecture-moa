/**
 * Material API Client Functions
 * REQ-FE-363: Typed API client functions for material operations
 */

import type {
  Material,
  MaterialListItem,
  CreateMaterialDto,
  UpdateMaterialDto,
  MaterialsQueryParams,
  PaginatedResponse,
} from "@shared";
import { api } from "./index";

/**
 * Build query string from parameters
 */
function buildQueryParams(params?: MaterialsQueryParams): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;

  const query: Record<string, string | number | boolean> = {};

  if (params.search) {
    query.search = params.search;
  }

  if (params.tags && params.tags.length > 0) {
    query.tags = params.tags.join(",");
  }

  if (params.status) {
    query.status = params.status;
  }

  if (params.sort) {
    query.sort = params.sort;
  }

  if (params.order) {
    query.order = params.order;
  }

  if (params.page) {
    query.page = params.page;
  }

  if (params.limit) {
    query.limit = params.limit;
  }

  return Object.keys(query).length > 0 ? query : undefined;
}

/**
 * Fetch paginated list of materials for a course
 * @param courseId - The course ID
 * @param params - Optional query parameters (filters, sort, pagination)
 * @returns Paginated response with material list items
 */
export async function getMaterials(
  courseId: string,
  params?: MaterialsQueryParams
): Promise<PaginatedResponse<MaterialListItem>> {
  const response = await api.get<PaginatedResponse<MaterialListItem>>(
    `/api/courses/${courseId}/materials`,
    { params: buildQueryParams(params) }
  );
  return response.data;
}

/**
 * Fetch a single material with full content
 * @param courseId - The course ID
 * @param materialId - The material ID
 * @returns Full material entity
 */
export async function getMaterial(
  courseId: string,
  materialId: string
): Promise<Material> {
  const response = await api.get<Material>(
    `/api/courses/${courseId}/materials/${materialId}`
  );
  return response.data;
}

/**
 * Create a new material
 * @param courseId - The course ID
 * @param dto - Material creation payload
 * @returns Created material entity
 */
export async function createMaterial(
  courseId: string,
  dto: CreateMaterialDto
): Promise<Material> {
  const response = await api.post<Material>(
    `/api/courses/${courseId}/materials`,
    dto
  );
  return response.data;
}

/**
 * Update an existing material
 * @param courseId - The course ID
 * @param materialId - The material ID
 * @param dto - Material update payload
 * @returns Updated material entity
 */
export async function updateMaterial(
  courseId: string,
  materialId: string,
  dto: UpdateMaterialDto
): Promise<Material> {
  const response = await api.patch<Material>(
    `/api/courses/${courseId}/materials/${materialId}`,
    dto
  );
  return response.data;
}

/**
 * Delete a material
 * @param courseId - The course ID
 * @param materialId - The material ID
 */
export async function deleteMaterial(
  courseId: string,
  materialId: string
): Promise<void> {
  await api.delete<never>(`/api/courses/${courseId}/materials/${materialId}`);
}

/**
 * Toggle material publication status
 * @param courseId - The course ID
 * @param materialId - The material ID
 * @returns Updated material entity with new status
 */
export async function toggleMaterialStatus(
  courseId: string,
  materialId: string
): Promise<Material> {
  // First fetch the current material to get its status
  const material = await getMaterial(courseId, materialId);
  const newStatus = material.status === "draft" ? "published" : "draft";

  const response = await api.patch<Material>(
    `/api/courses/${courseId}/materials/${materialId}/status`,
    { status: newStatus }
  );
  return response.data;
}

/**
 * Upload an image for use in material content
 * @param courseId - The course ID
 * @param file - Image file to upload
 * @returns Object containing the uploaded image URL
 */
export async function uploadMaterialImage(
  courseId: string,
  file: File
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  // Use fetch directly for multipart/form-data
  const response = await fetch(
    `/api/courses/${courseId}/materials/images`,
    {
      method: "POST",
      body: formData,
      // Don't set Content-Type, let browser set it with boundary
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  const data = await response.json() as { data: { url: string } };
  return data.data;
}
