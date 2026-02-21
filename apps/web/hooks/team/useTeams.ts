"use client";

import { useQuery } from "@tanstack/react-query";
import type { Team } from "@shared";
import { useAuth } from "~/hooks/useAuth";
import {
  fetchMyTeams,
  fetchAvailableTeams,
} from "~/lib/supabase/teams";

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
 * useMyTeams Hook
 * REQ-BE-006-011: Fetches teams where current user is a member via Supabase
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
  const { user } = useAuth();

  return useQuery<Team[]>({
    queryKey: teamKeys.myTeams(),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- user existence guaranteed by enabled
    queryFn: () => fetchMyTeams(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * useAvailableTeams Hook
 * REQ-BE-006-012: Fetches teams available to join with optional search via Supabase
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
  return useQuery<Team[]>({
    queryKey: teamKeys.availableTeams(search),
    queryFn: () => fetchAvailableTeams(search),
    enabled: true,
    staleTime: 30 * 1000, // 30 seconds (more dynamic for search results)
  });
}
