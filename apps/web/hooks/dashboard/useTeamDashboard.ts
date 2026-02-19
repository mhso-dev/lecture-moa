/**
 * Team Dashboard TanStack Query Hooks
 * REQ-FE-235: TanStack Query hooks for team dashboard data
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { TEAM_DASHBOARD_ENDPOINTS } from "~/lib/api-endpoints";
import type {
  TeamOverview,
  TeamMember,
  SharedMemo,
  TeamActivityItem,
} from "@shared";

/**
 * Query key namespace for team dashboard
 */
export const teamDashboardKeys = {
  all: ["dashboard", "team"] as const,
  overview: () => [...teamDashboardKeys.all, "overview"] as const,
  members: () => [...teamDashboardKeys.all, "members"] as const,
  sharedMemos: (page: number) => [...teamDashboardKeys.all, "memos", { page }] as const,
  activity: (page: number) => [...teamDashboardKeys.all, "activity", { page }] as const,
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
 * @returns TanStack Query result with TeamOverview data
 *
 * @example
 * ```tsx
 * const { data: overview, isLoading, error } = useTeamOverview();
 * // overview.name, overview.memberCount, etc.
 * ```
 */
export function useTeamOverview() {
  return useQuery<TeamOverview>({
    queryKey: teamDashboardKeys.overview(),
    queryFn: async () => {
      const response = await api.get<TeamOverview>(
        TEAM_DASHBOARD_ENDPOINTS.overview
      );
      return response.data;
    },
    staleTime: STALE_TIME.OVERVIEW,
  });
}

/**
 * Hook to fetch team members with activity status
 * REQ-FE-232: Team Members Widget data
 *
 * @returns TanStack Query result with TeamMember[] data
 *
 * @example
 * ```tsx
 * const { data: members, isLoading } = useTeamMembers();
 * // members with lastActiveAt for activity indicator
 * ```
 */
export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: teamDashboardKeys.members(),
    queryFn: async () => {
      const response = await api.get<TeamMember[]>(
        TEAM_DASHBOARD_ENDPOINTS.members
      );
      return response.data;
    },
    staleTime: STALE_TIME.OVERVIEW,
  });
}

/**
 * Options for useSharedMemos hook
 */
export interface UseSharedMemosOptions {
  /** Page number for pagination (1-indexed) */
  page?: number;
}

/**
 * Hook to fetch paginated shared memos
 * REQ-FE-233: Shared Memos Feed Widget data
 *
 * @param options - Pagination options
 * @returns TanStack Query result with SharedMemo[] data
 *
 * @example
 * ```tsx
 * const { data: memos, isLoading } = useSharedMemos({ page: 1 });
 * ```
 */
export function useSharedMemos(options: UseSharedMemosOptions = {}) {
  const page = options.page ?? 1;

  return useQuery<SharedMemo[]>({
    queryKey: teamDashboardKeys.sharedMemos(page),
    queryFn: async () => {
      const response = await api.get<SharedMemo[]>(
        TEAM_DASHBOARD_ENDPOINTS.sharedMemos,
        { params: { page } }
      );
      return response.data;
    },
    staleTime: STALE_TIME.OVERVIEW,
  });
}

/**
 * Options for useTeamActivity hook
 */
export interface UseTeamActivityOptions {
  /** Page number for pagination (1-indexed) */
  page?: number;
}

/**
 * Hook to fetch paginated team activity feed
 * REQ-FE-234: Team Activity Widget data
 *
 * Uses shorter stale time (30 seconds) for more real-time updates.
 *
 * @param options - Pagination options
 * @returns TanStack Query result with TeamActivityItem[] data
 *
 * @example
 * ```tsx
 * const { data: activity, isLoading } = useTeamActivity({ page: 1 });
 * ```
 */
export function useTeamActivity(options: UseTeamActivityOptions = {}) {
  const page = options.page ?? 1;

  return useQuery<TeamActivityItem[]>({
    queryKey: teamDashboardKeys.activity(page),
    queryFn: async () => {
      const response = await api.get<TeamActivityItem[]>(
        TEAM_DASHBOARD_ENDPOINTS.activityFeed,
        { params: { page } }
      );
      return response.data;
    },
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
