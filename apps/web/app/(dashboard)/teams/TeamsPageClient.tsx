/**
 * TeamsPageClient Component
 * TASK-019: Client component wrapper for teams page
 * REQ-FE-710: Client-side data fetching with TanStack Query
 */

"use client";

import { useMyTeams } from "~/hooks/team/useTeams";
import { useTeamSearch } from "~/hooks/team/useTeamSearch";
import { useAuthStore } from "~/stores/auth.store";
import { TeamListContent } from "~/components/team/TeamListContent";

/**
 * TeamsPageClient handles client-side data fetching
 * for the teams list page using TanStack Query hooks
 */
export function TeamsPageClient() {
  // Get user for potential future use (auth checks, etc.)
  useAuthStore((state) => state.user);

  // Fetch user's teams
  const { data: myTeams = [], isLoading: isLoadingMyTeams } = useMyTeams();

  // Fetch available teams with search
  const {
    teams: availableTeams = [],
    isLoading: isLoadingAvailable,
    searchQuery,
    setSearchQuery,
  } = useTeamSearch();

  const isLoading = isLoadingMyTeams || isLoadingAvailable;

  return (
    <div className="container py-6">
      <TeamListContent
        myTeams={myTeams}
        availableTeams={availableTeams}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </div>
  );
}
