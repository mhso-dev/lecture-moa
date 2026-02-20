/**
 * Memo Type Definitions
 * REQ-FE-701: Memo-related type definitions for personal and team memos
 */

// ============================================================================
// Memo Types
// ============================================================================

/**
 * Memo visibility options
 * REQ-FE-701: String union for memo visibility scope
 */
export type MemoVisibility = "personal" | "team";

/**
 * Memo structure for personal and team memos
 * REQ-FE-701: Complete memo data structure
 */
export interface Memo {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  teamId: string | null;
  materialId: string | null;
  anchorId: string | null;
  tags: string[];
  visibility: MemoVisibility;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Memo link target for material/anchor linking
 * REQ-FE-701: Link information when memo is attached to material
 */
export interface MemoLinkTarget {
  materialId: string;
  materialTitle: string;
  courseId: string;
  anchorId: string | null;
  anchorText: string | null;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Memo detail API response
 * REQ-FE-701: Response structure for memo detail endpoint
 */
export interface MemoDetailResponse {
  memo: Memo;
  linkTarget: MemoLinkTarget | null;
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Memo filter parameters
 * REQ-FE-701: Query parameters for filtering memos
 */
export interface MemoFilterParams {
  visibility?: MemoVisibility;
  teamId?: string;
  courseId?: string;
  materialId?: string;
  tags?: string[];
  isDraft?: boolean;
  search?: string;
}

/**
 * Create memo request
 * REQ-FE-701: Request body for creating a new memo
 */
export interface CreateMemoRequest {
  title: string;
  content: string;
  tags?: string[];
  materialId?: string;
  anchorId?: string;
  teamId?: string;
  visibility: MemoVisibility;
}

/**
 * Update memo request
 * REQ-FE-701: Request body for updating an existing memo
 */
export interface UpdateMemoRequest {
  title?: string;
  content?: string;
  tags?: string[];
  materialId?: string;
  anchorId?: string;
  teamId?: string;
  visibility?: MemoVisibility;
  isDraft?: boolean;
}
