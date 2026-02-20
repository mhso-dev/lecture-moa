"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  TeamDetailResponse,
  TeamMemberDetail,
  TeamActivity,
  PaginatedResponse,
} from "@shared";
import { api } from "~/lib/api";
import { teamKeys } from "./useTeams";

/**
 * Fetch single team detail
 * REQ-FE-786: GET /api/v1/teams/{teamId}
 */
async function fetchTeamDetail(teamId: string): Promise<TeamDetailResponse> {
  const response = await api.get<TeamDetailResponse>(`/api/v1/teams/${teamId}`);
  return response.data;
}

/**
 * Fetch team members
 * REQ-FE-786: GET /api/v1/teams/{teamId}/members
 */
async function fetchTeamMembers(teamId: string): Promise<TeamMemberDetail[]> {
  const response = await api.get<{ members: TeamMemberDetail[] }>(
    `/api/v1/teams/${teamId}/members`
  );
  return response.data.members;
}

/**
 * Fetch team activity
 * REQ-FE-786: GET /api/v1/teams/{teamId}/activity
 */
async function fetchTeamActivity(
  teamId: string,
  page: number = 1
): Promise<PaginatedResponse<TeamActivity>> {
  const response = await api.get<PaginatedResponse<TeamActivity>>(
    `/api/v1/teams/${teamId}/activity`,
    { params: { page, limit: 20 } }
  );
  return response.data;
}

/**
 * useTeamDetail Hook
 * REQ-FE-786: Fetches single team detail with members
 *
 * @param teamId - The team ID
 * @returns TanStack Query result with TeamDetailResponse
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTeamDetail(teamId);
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <NotFoundError />;
 *
 * const { team, members } = data;
 * return <TeamDetailHeader team={team} members={members} />;
 * ```
 */
export function useTeamDetail(teamId: string) {
  return useQuery<TeamDetailResponse, Error>({
    queryKey: teamKeys.detail(teamId),
    queryFn: () => fetchTeamDetail(teamId),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * useTeamMembers Hook
 * REQ-FE-786: Fetches team member list
 *
 * @param teamId - The team ID
 * @returns TanStack Query result with TeamMemberDetail array
 *
 * @example
 * ```tsx
 * const { data: members, isLoading } = useTeamMembers(teamId);
 *
 * if (isLoading) return <MemberSkeleton count={5} />;
 * return <MemberList members={members} />;
 * ```
 */
export function useTeamMembers(teamId: string) {
  return useQuery<TeamMemberDetail[], Error>({
    queryKey: teamKeys.members(teamId),
    queryFn: () => fetchTeamMembers(teamId),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * useTeamActivity Hook
 * REQ-FE-786: Fetches paginated team activity feed
 *
 * @param teamId - The team ID
 * @param page - Page number (default: 1)
 * @returns TanStack Query result with paginated TeamActivity
 *
 * @example
 * ```tsx
 * const [page, setPage] = useState(1);
 * const { data, isLoading, isFetching } = useTeamActivity(teamId, page);
 *
 * const activities = data?.data ?? [];
 * const totalPages = data?.pagination.totalPages ?? 0;
 *
 * return (
 *   <>
 *     <ActivityList activities={activities} />
 *     {page < totalPages && (
 *       <Button onClick={() => setPage(p => p + 1)} loading={isFetching}>
 *         Load More
 *       </Button>
 *     )}
 *   </>
 * );
 * ```
 */
export function useTeamActivity(teamId: string, page: number = 1) {
  return useQuery<PaginatedResponse<TeamActivity>, Error>({
    queryKey: teamKeys.activity(teamId, page),
    queryFn: () => fetchTeamActivity(teamId, page),
    enabled: !!teamId,
    staleTime: 30 * 1000, // 30 seconds (activity is more dynamic)
    gcTime: 5 * 60 * 1000, // 5 minutes (keep cached for back navigation)
  });
}
