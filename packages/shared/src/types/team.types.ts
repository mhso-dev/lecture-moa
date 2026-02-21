/**
 * Team Type Definitions
 * REQ-FE-700: Team-related type definitions extending dashboard types
 */

import type {
  TeamActivityItem,
  TeamMember,
  TeamMemberRole,
  TeamOverview,
} from "./dashboard.types";

// Re-export TeamMemberRole for convenience
export type { TeamMemberRole } from "./dashboard.types";

// ============================================================================
// Team Types
// ============================================================================

/**
 * Team extends TeamOverview with additional fields for detailed team information
 * REQ-FE-700: Full team data structure
 */
export interface Team extends TeamOverview {
  maxMembers: number;
  courseId: string;
  inviteCode: string | null;
  createdBy: string;
  updatedAt: Date;
}

/**
 * Team member with detailed information
 * REQ-FE-700: Extends TeamMember with user and membership details
 */
export interface TeamMemberDetail extends TeamMember {
  userId: string;
  teamId: string;
  joinedAt: Date;
}

/**
 * Team activity with additional metadata
 * REQ-FE-700: Extends TeamActivityItem with team and actor context
 */
export interface TeamActivity extends TeamActivityItem {
  teamId: string;
  actorId: string;
  payload: Record<string, unknown>;
}

// ============================================================================
// API Response Types
// ============================================================================

import type { Pagination } from "./api.types";

/**
 * Team detail API response
 * REQ-FE-700: Response structure for team detail endpoint
 */
export interface TeamDetailResponse {
  team: Team;
  members: TeamMemberDetail[];
}

/**
 * Team list API response with pagination
 * REQ-FE-700: Response structure for team list endpoint
 */
export interface TeamListResponse {
  teams: Team[];
  pagination: Pagination;
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Team member update request
 * REQ-FE-700: Request body for updating member role
 */
export interface TeamMemberUpdateRequest {
  role: TeamMemberRole;
}

