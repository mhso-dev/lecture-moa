/**
 * Team Hooks Index
 * REQ-FE-785 - REQ-FE-789: Team-related TanStack Query hooks
 */

// Team list queries
export { teamKeys, useMyTeams, useAvailableTeams } from "./useTeams";

// Team search
export { useTeamSearch } from "./useTeamSearch";

// Team detail queries (useTeamActivity deferred to SPEC-BE-007)
export { useTeamDetail, useTeamMembers } from "./useTeam";

// Team join by invite code
export { useJoinTeam } from "./useTeamMembership";

// Team CRUD mutations
export { useCreateTeam, useUpdateTeam, useDeleteTeam } from "./useTeamMutations";

// Team membership mutations
export { useTeamMembership } from "./useTeamMembership";

// Team memo WebSocket
export { useTeamMemoSocket } from "./useTeamMemoSocket";
export type { UseTeamMemoSocketReturn } from "./useTeamMemoSocket";
