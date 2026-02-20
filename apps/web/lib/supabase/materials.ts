/**
 * Supabase Query Layer for Materials
 * Direct database queries replacing the REST API client.
 */

import { createClient } from "./client";
import type { Database } from "~/types/supabase";
import type {
  Material,
  MaterialListItem,
  MaterialsQueryParams,
} from "@shared";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MaterialInsert = Database["public"]["Tables"]["materials"]["Insert"];
type MaterialUpdate = Database["public"]["Tables"]["materials"]["Update"];

/**
 * Profile data joined from courses -> profiles via instructor_id.
 */
interface AuthorInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * Material row enriched with author information.
 */
export interface MaterialWithAuthor extends MaterialRow {
  author: AuthorInfo;
}

/**
 * Paginated result container.
 */
export interface PaginatedMaterials {
  data: MaterialWithAuthor[];
  count: number;
}

/**
 * Converts a Supabase MaterialWithAuthor (snake_case DB row) to
 * the frontend Material type (camelCase).
 */
export function toMaterial(row: MaterialWithAuthor): Material {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt ?? "",
    status: row.status,
    position: row.position,
    tags: row.tags,
    readTimeMinutes: row.read_time_minutes ?? 0,
    authorId: row.author.id,
    author: {
      id: row.author.id,
      name: row.author.name,
      avatarUrl: row.author.avatarUrl,
    },
    qaCount: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Converts a Supabase MaterialWithAuthor to a MaterialListItem (no content).
 */
export function toMaterialListItem(row: MaterialWithAuthor): MaterialListItem {
  const { content: _, ...listItem } = toMaterial(row);
  return listItem;
}

/**
 * Fetches the author (instructor) of a course from the profiles table.
 * Returns a fallback author object if the lookup fails.
 */
async function fetchCourseAuthor(courseId: string): Promise<AuthorInfo> {
  const supabase = createClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("instructor_id")
    .eq("id", courseId)
    .single();

  if (courseError) {
    return { id: "", name: "Unknown", avatarUrl: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", course.instructor_id)
    .single();

  if (profileError) {
    return { id: course.instructor_id, name: "Unknown", avatarUrl: null };
  }

  return {
    id: profile.id,
    name: profile.display_name,
    avatarUrl: profile.avatar_url,
  };
}

/**
 * Fetches a paginated list of materials for a course.
 * Supports optional status filter, title search, and pagination.
 *
 * @param courseId - The course ID
 * @param params - Optional query parameters (filters, sort, pagination)
 * @returns Paginated list of materials with author info
 */
export async function fetchMaterials(
  courseId: string,
  params?: MaterialsQueryParams,
): Promise<PaginatedMaterials> {
  const supabase = createClient();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("materials")
    .select("*", { count: "exact" })
    .eq("course_id", courseId)
    .order("position", { ascending: true })
    .range(offset, offset + limit - 1);

  if (params?.status) {
    query = query.eq("status", params.status);
  }

  if (params?.search) {
    query = query.ilike("title", `%${params.search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch materials: ${error.message}`);
  }

  const author = await fetchCourseAuthor(courseId);

  const materials: MaterialWithAuthor[] = data.map((row) => ({
    ...row,
    author,
  }));

  return { data: materials, count: count ?? 0 };
}

/**
 * Fetches a single material by ID with full content and author info.
 *
 * @param courseId - The course ID
 * @param materialId - The material ID
 * @returns Material row with author info
 * @throws Error if material not found
 */
export async function fetchMaterial(
  courseId: string,
  materialId: string,
): Promise<MaterialWithAuthor> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("id", materialId)
    .eq("course_id", courseId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch material: ${error.message}`);
  }

  const author = await fetchCourseAuthor(courseId);

  return { ...data, author };
}

/**
 * Creates a new material for a course.
 * Automatically assigns the next available position.
 *
 * @param data - Material insert payload (must include course_id and title)
 * @returns Newly created material with author info
 */
export async function createMaterial(
  data: MaterialInsert,
): Promise<MaterialWithAuthor> {
  const supabase = createClient();

  // Determine next position for the course
  const { data: existing, error: positionError } = await supabase
    .from("materials")
    .select("position")
    .eq("course_id", data.course_id)
    .order("position", { ascending: false })
    .limit(1);

  if (positionError) {
    throw new Error(`Failed to determine material position: ${positionError.message}`);
  }

  const lastPosition = existing.at(0)?.position ?? 0;
  const nextPosition = lastPosition + 1;

  const { data: created, error } = await supabase
    .from("materials")
    .insert({ ...data, position: data.position ?? nextPosition })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create material: ${error.message}`);
  }

  const author = await fetchCourseAuthor(data.course_id);

  return { ...created, author };
}

/**
 * Updates an existing material.
 *
 * @param materialId - The material ID to update
 * @param data - Partial material update payload
 * @returns Updated material with author info
 */
export async function updateMaterial(
  materialId: string,
  data: MaterialUpdate,
): Promise<MaterialWithAuthor> {
  const supabase = createClient();

  const { data: updated, error } = await supabase
    .from("materials")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", materialId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update material: ${error.message}`);
  }

  const author = await fetchCourseAuthor(updated.course_id);

  return { ...updated, author };
}

/**
 * Deletes a material by ID.
 *
 * @param materialId - The material ID to delete
 */
export async function deleteMaterial(materialId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", materialId);

  if (error) {
    throw new Error(`Failed to delete material: ${error.message}`);
  }
}

/**
 * Toggles the publication status of a material between draft and published.
 *
 * @param materialId - The material ID
 * @returns Updated material with new status and author info
 */
export async function toggleMaterialStatus(
  materialId: string,
): Promise<MaterialWithAuthor> {
  const supabase = createClient();

  // Read current status
  const { data: current, error: fetchError } = await supabase
    .from("materials")
    .select("status, course_id")
    .eq("id", materialId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch material status: ${fetchError.message}`);
  }

  const newStatus: "draft" | "published" =
    current.status === "draft" ? "published" : "draft";

  const { data: updated, error } = await supabase
    .from("materials")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", materialId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to toggle material status: ${error.message}`);
  }

  const author = await fetchCourseAuthor(updated.course_id);

  return { ...updated, author };
}
