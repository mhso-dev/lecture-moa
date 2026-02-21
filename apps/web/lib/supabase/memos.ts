/**
 * Supabase Query Layer for Memos
 *
 * Provides direct Supabase database access for all memo-related operations.
 * Replaces REST API calls with typed Supabase client queries.
 * Uses browser client for all client-side operations (RLS enforced by Supabase).
 */

import { createClient } from "./client";
import type { Database } from "~/types/supabase";
import type {
  Memo,
  MemoDetailResponse,
  MemoLinkTarget,
  MemoFilterParams,
  CreateMemoRequest,
  UpdateMemoRequest,
} from "@shared";

type MemoRow = Database["public"]["Tables"]["memos"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// ---------------------------------------------------------------------------
// Joined row types (from Supabase select with joins)
// ---------------------------------------------------------------------------

/** Memo row with profiles join data attached */
interface MemoRowWithProfile extends MemoRow {
  profiles: Pick<ProfileRow, "display_name" | "avatar_url"> | null;
}

/** Material data shape returned from the join in fetchMemoDetail */
interface MaterialJoinData {
  id: string;
  title: string;
  course_id: string;
}

/** Memo row with profiles + materials join data for detail view */
interface MemoRowWithJoins extends MemoRow {
  profiles: Pick<ProfileRow, "display_name" | "avatar_url"> | null;
  materials: MaterialJoinData | null;
}

// ---------------------------------------------------------------------------
// Type Mappers
// ---------------------------------------------------------------------------

/**
 * Map a DB memo row (with profiles join) to the frontend Memo type.
 * Converts snake_case DB columns to camelCase frontend properties.
 */
function mapMemoRow(row: MemoRowWithProfile): Memo {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    authorId: row.author_id,
    authorName: row.profiles?.display_name ?? "Unknown",
    authorAvatarUrl: row.profiles?.avatar_url ?? undefined,
    teamId: row.team_id,
    materialId: row.material_id,
    anchorId: row.anchor_id,
    tags: row.tags,
    visibility: row.visibility,
    isDraft: row.is_draft,
    createdAt: row.created_at as unknown as Date,
    updatedAt: row.updated_at as unknown as Date,
  };
}

// ---------------------------------------------------------------------------
// Select strings for Supabase queries
// ---------------------------------------------------------------------------

/** Select string for memo list queries (memo + profiles join) */
const MEMO_LIST_SELECT =
  "*, profiles!memos_author_id_fkey(display_name, avatar_url)";

/** Select string for memo detail query (memo + profiles + materials join) */
const MEMO_DETAIL_SELECT =
  "*, profiles!memos_author_id_fkey(display_name, avatar_url), materials!memos_material_id_fkey(id, title, course_id)";

/** Select string for memo mutations (insert/update returning with profiles) */
const MEMO_MUTATION_SELECT =
  "*, profiles!memos_author_id_fkey(display_name, avatar_url)";

// ---------------------------------------------------------------------------
// Memo Query Functions
// ---------------------------------------------------------------------------

/**
 * Fetch personal memos for a user with optional filters and pagination.
 *
 * @param userId - The user ID to filter personal memos
 * @param filters - Optional filter parameters (materialId, tags, isDraft, search)
 * @param range - Pagination range { from, to } for Supabase .range()
 * @returns Paginated memos with total count
 */
export async function fetchPersonalMemos(
  userId: string,
  filters: MemoFilterParams,
  range: { from: number; to: number },
): Promise<{ data: Memo[]; count: number }> {
  const supabase = createClient();

  let query = supabase
    .from("memos")
    .select(MEMO_LIST_SELECT, { count: "exact", head: false })
    .eq("author_id", userId)
    .eq("visibility", "personal")
    .order("created_at", { ascending: false });

  // Apply optional filters
  if (filters.materialId) {
    query = query.eq("material_id", filters.materialId);
  }
  if (filters.tags && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags);
  }
  if (filters.isDraft !== undefined) {
    query = query.eq("is_draft", filters.isDraft);
  }
  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  // Apply pagination
  query = query.range(range.from, range.to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch personal memos: ${error.message}`);
  }

  const memos: Memo[] = (data as MemoRowWithProfile[]).map(mapMemoRow);

  return { data: memos, count: count ?? 0 };
}

/**
 * Fetch team memos with pagination.
 *
 * @param teamId - The team ID to filter memos
 * @param range - Pagination range { from, to } for Supabase .range()
 * @returns Paginated team memos with total count
 */
export async function fetchTeamMemos(
  teamId: string,
  range: { from: number; to: number },
): Promise<{ data: Memo[]; count: number }> {
  const supabase = createClient();

  const { data, error, count } = await supabase
    .from("memos")
    .select(MEMO_LIST_SELECT, { count: "exact", head: false })
    .eq("team_id", teamId)
    .eq("visibility", "team")
    .order("created_at", { ascending: false })
    .range(range.from, range.to);

  if (error) {
    throw new Error(`Failed to fetch team memos: ${error.message}`);
  }

  const memos: Memo[] = (data as MemoRowWithProfile[]).map(mapMemoRow);

  return { data: memos, count: count ?? 0 };
}

/**
 * Fetch a single memo by ID with full detail and link target information.
 * Joins with profiles (author info) and materials (link target).
 *
 * @param memoId - The memo ID to fetch
 * @returns MemoDetailResponse with memo data and optional linkTarget
 */
export async function fetchMemoDetail(
  memoId: string,
): Promise<MemoDetailResponse> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("memos")
    .select(MEMO_DETAIL_SELECT)
    .eq("id", memoId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch memo detail: ${error.message}`);
  }

  const row = data as MemoRowWithJoins;
  const memo = mapMemoRow(row);

  // Build linkTarget from materials join data
  let linkTarget: MemoLinkTarget | null = null;

  if (row.materials) {
    linkTarget = {
      materialId: row.materials.id,
      materialTitle: row.materials.title,
      courseId: row.materials.course_id,
      anchorId: row.anchor_id,
      anchorText: null,
    };
  }

  return { memo, linkTarget };
}

/**
 * Create a new memo.
 *
 * @param data - Create memo request payload
 * @param userId - The authenticated user's ID (author)
 * @returns Created memo with author info
 */
export async function createMemo(
  data: CreateMemoRequest,
  userId: string,
): Promise<Memo> {
  const supabase = createClient();

  const insertData: Database["public"]["Tables"]["memos"]["Insert"] = {
    author_id: userId,
    title: data.title,
    content: data.content,
    material_id: data.materialId ?? null,
    anchor_id: data.anchorId ?? null,
    team_id: data.teamId ?? null,
    tags: data.tags ?? [],
    visibility: data.visibility,
  };

  const { data: created, error } = await supabase
    .from("memos")
    .insert(insertData)
    .select(MEMO_MUTATION_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to create memo: ${error.message}`);
  }

  return mapMemoRow(created as MemoRowWithProfile);
}

/**
 * Update an existing memo.
 *
 * @param memoId - The memo ID to update
 * @param data - Partial update request payload
 * @returns Updated memo with author info
 */
export async function updateMemo(
  memoId: string,
  data: UpdateMemoRequest,
): Promise<Memo> {
  const supabase = createClient();

  const updateData: Database["public"]["Tables"]["memos"]["Update"] = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.materialId !== undefined) updateData.material_id = data.materialId;
  if (data.anchorId !== undefined) updateData.anchor_id = data.anchorId;
  if (data.teamId !== undefined) updateData.team_id = data.teamId;
  if (data.visibility !== undefined) updateData.visibility = data.visibility;
  if (data.isDraft !== undefined) updateData.is_draft = data.isDraft;

  const { data: updated, error } = await supabase
    .from("memos")
    .update(updateData)
    .eq("id", memoId)
    .select(MEMO_MUTATION_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to update memo: ${error.message}`);
  }

  return mapMemoRow(updated as MemoRowWithProfile);
}

/**
 * Delete a memo by ID.
 *
 * @param memoId - The memo ID to delete
 */
export async function deleteMemo(memoId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("memos")
    .delete()
    .eq("id", memoId);

  if (error) {
    throw new Error(`Failed to delete memo: ${error.message}`);
  }
}
