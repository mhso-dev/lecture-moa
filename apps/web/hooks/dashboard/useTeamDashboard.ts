/**
 * Team Dashboard TanStack Query Hooks
 * REQ-FE-235: TanStack Query hooks for team dashboard data
 */

import { useQuery } from "@tanstack/react-query";
import type {
  TeamOverview,
  TeamMember,
  SharedMemo,
  TeamActivityItem,
} from "@shared";
import {
  fetchTeamOverview,
  fetchTeamMembers,
  fetchSharedMemos,
  fetchTeamActivityFeed,
} from "~/lib/supabase/dashboard";
import type { PaginatedResponse } from "~/lib/supabase/dashboard";

/**
 * Query key namespace for team dashboard
 */
export const teamDashboardKeys = {
  all: ["dashboard", "team"] as const,
  overview: (teamId: string) => [...teamDashboardKeys.all, "overview", teamId] as const,
  members: (teamId: string) => [...teamDashboardKeys.all, "members", teamId] as const,
  sharedMemos: (teamId: string, page: number) => [...teamDashboardKeys.all, "memos", teamId, { page }] as const,
  activity: (teamId: string, page: number) => [...teamDashboardKeys.all, "activity", teamId, { page }] as const,
};

/**
 * Stale time constants (in milliseconds)
 */
const STALE_TIME = {
  /** 2 minutes for overview data */
  OVERVIEW: 2 * 60 * 1000,
  /** 30 seconds for activity feed (more real-time) */
  ACTIVITY: 30 * 1000,
};

/**
 * Hook to fetch team overview with metadata and stats
 * REQ-FE-231: Team Overview Widget data
 *
 * @param teamId - The team ID to fetch overview for
 * @returns TanStack Query result with TeamOverview data
 *
 * @example
 * ```tsx
 * const { data: overview, isLoading, error } = useTeamOverview("team-123");
 * // overview.name, overview.memberCount, etc.
 * ```
 */
export function useTeamOverview(teamId: string) {
  return useQuery<TeamOverview>({
    queryKey: teamDashboardKeys.overview(teamId),
    queryFn: () => fetchTeamOverview(teamId),
    staleTime: STALE_TIME.OVERVIEW,
  });
}

/**
 * Hook to fetch team members with activity status
 * REQ-FE-232: Team Members Widget data
 *
 * @param teamId - The team ID to fetch members for
 * @returns TanStack Query result with TeamMember[] data
 *
 * @example
 * ```tsx
 * const { data: members, isLoading } = useTeamMembers("team-123");
 * // members with lastActiveAt for activity indicator
 * ```
 */
export function useTeamMembers(teamId: string) {
  return useQuery<TeamMember[]>({
    queryKey: teamDashboardKeys.members(teamId),
    queryFn: () => fetchTeamMembers(teamId),
    staleTime: STALE_TIME.OVERVIEW,
  });
}

/**
 * Options for useSharedMemos hook
 */
export interface UseSharedMemosOptions {
  /** The team ID to fetch shared memos for */
  teamId: string;
  /** Page number for pagination (1-indexed) */
  page?: number;
}

/**
 * Hook to fetch paginated shared memos
 * REQ-FE-233: Shared Memos Feed Widget data
 *
 * @param options - Team ID and pagination options
 * @returns TanStack Query result with PaginatedResponse<SharedMemo> data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useSharedMemos({ teamId: "team-123", page: 1 });
 * // data.data, data.totalCount, data.hasMore
 * ```
 */
export function useSharedMemos(options: UseSharedMemosOptions) {
  const { teamId, page = 1 } = options;

  return useQuery<PaginatedResponse<SharedMemo>>({
    queryKey: teamDashboardKeys.sharedMemos(teamId, page),
    queryFn: () => fetchSharedMemos(teamId, page, 10),
    staleTime: STALE_TIME.OVERVIEW,
  });
}

/**
 * Options for useTeamActivity hook
 */
export interface UseTeamActivityOptions {
  /** The team ID to fetch activity for */
  teamId: string;
  /** Page number for pagination (1-indexed) */
  page?: number;
}

/**
 * Hook to fetch paginated team activity feed
 * REQ-FE-234: Team Activity Widget data
 *
 * Uses shorter stale time (30 seconds) for more real-time updates.
 *
 * @param options - Team ID and pagination options
 * @returns TanStack Query result with PaginatedResponse<TeamActivityItem> data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTeamActivity({ teamId: "team-123", page: 1 });
 * // data.data, data.totalCount, data.hasMore
 * ```
 */
export function useTeamActivity(options: UseTeamActivityOptions) {
  const { teamId, page = 1 } = options;

  return useQuery<PaginatedResponse<TeamActivityItem>>({
    queryKey: teamDashboardKeys.activity(teamId, page),
    queryFn: () => fetchTeamActivityFeed(teamId, page, 10),
    staleTime: STALE_TIME.ACTIVITY,
  });
}

// Re-export types for convenience
export type {
  TeamOverview,
  TeamMember,
  SharedMemo,
  TeamActivityItem,
};
