/**
 * Material Type Definitions
 * REQ-FE-360: Shared material types for frontend and backend
 */

/**
 * Material publication status
 */
export type MaterialStatus = "draft" | "published";

/**
 * Full material entity with content
 */
export interface Material {
  id: string;
  courseId: string;
  title: string;
  content: string;
  excerpt: string;
  status: MaterialStatus;
  position: number;
  tags: string[];
  readTimeMinutes: number;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  qaCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Material list item without full content for performance
 * List view excludes full content for performance
 */
export type MaterialListItem = Omit<Material, "content">;

/**
 * Request payload for creating a new material
 */
export interface CreateMaterialDto {
  title: string;
  content: string;
  tags?: string[];
  status?: MaterialStatus;
  position?: number;
}

/**
 * Request payload for updating an existing material
 */
export interface UpdateMaterialDto extends Partial<CreateMaterialDto> {
  id: string;
}

/**
 * Table of contents item structure
 */
export interface TocItem {
  id: string;
  level: 2 | 3 | 4;
  text: string;
  children: TocItem[];
}

/**
 * Material filtering options
 */
export interface MaterialFilters {
  search?: string;
  tags?: string[];
  status?: MaterialStatus;
}

/**
 * Available sort keys for materials
 */
export type MaterialSortKey =
  | "position"
  | "title"
  | "createdAt"
  | "updatedAt"
  | "readTimeMinutes";

/**
 * Sort order direction
 */
export type SortOrder = "asc" | "desc";

/**
 * Material sort configuration
 */
export interface MaterialSortOptions {
  key: MaterialSortKey;
  order: SortOrder;
}

/**
 * Query parameters for fetching materials list
 */
export interface MaterialsQueryParams extends MaterialFilters {
  sort?: MaterialSortKey;
  order?: SortOrder;
  page?: number;
  limit?: number;
}
