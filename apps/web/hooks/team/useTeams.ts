"use client";

import { useQuery } from "@tanstack/react-query";
import type { Team, TeamListResponse } from "@shared";
import { api } from "~/lib/api";

/**
 * Query key factory for teams
 * REQ-FE-785: Query keys for team list queries
 */
export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  myTeams: () => [...teamKeys.lists(), "my"] as const,
  availableTeams: (search?: string) =>
    [...teamKeys.lists(), "available", search] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (teamId: string) => [...teamKeys.details(), teamId] as const,
  members: (teamId: string) => [...teamKeys.detail(teamId), "members"] as const,
  activity: (teamId: string, page?: number) =>
    [...teamKeys.detail(teamId), "activity", page] as const,
};

/**
 * Fetch teams where current user is a member
 * REQ-FE-785: GET /api/v1/teams/?member=me
 */
async function fetchMyTeams(): Promise<Team[]> {
  const response = await api.get<TeamListResponse>("/api/v1/teams/", {
    params: { member: "me" },
  });
  return response.data.teams;
}

/**
 * Fetch teams available to join
 * REQ-FE-785: GET /api/v1/teams/?available=true&search={query}
 */
async function fetchAvailableTeams(search?: string): Promise<Team[]> {
  const params: Record<string, string | boolean> = { available: true };
  if (search) {
    params.search = search;
  }
  const response = await api.get<TeamListResponse>("/api/v1/teams/", {
    params,
  });
  return response.data.teams;
}

/**
 * useMyTeams Hook
 * REQ-FE-785: Fetches teams where current user is a member
 *
 * @returns TanStack Query result with Team array
 *
 * @example
 * ```tsx
 * const { data: teams, isLoading, isError, refetch } = useMyTeams();
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <ErrorState onRetry={refetch} />;
 * return <TeamList teams={teams} />;
 * ```
 */
export function useMyTeams() {
  return useQuery<Team[], Error>({
    queryKey: teamKeys.myTeams(),
    queryFn: fetchMyTeams,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * useAvailableTeams Hook
 * REQ-FE-785: Fetches teams available to join with optional search
 *
 * @param search - Optional search query string
 * @returns TanStack Query result with Team array
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 * const { data: teams, isLoading } = useAvailableTeams(debouncedSearch);
 *
 * return (
 *   <>
 *     <Input value={search} onChange={(e) => setSearch(e.target.value)} />
 *     <TeamGrid teams={teams} loading={isLoading} />
 *   </>
 * );
 * ```
 */
export function useAvailableTeams(search?: string) {
  return useQuery<Team[], Error>({
    queryKey: teamKeys.availableTeams(search),
    queryFn: () => fetchAvailableTeams(search),
    enabled: true,
    staleTime: 30 * 1000, // 30 seconds (more dynamic for search results)
  });
}
