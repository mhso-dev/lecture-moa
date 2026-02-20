/**
 * useTeamSearch Hook
 * TASK-018: Team search with debounced input
 * REQ-FE-714: Debounces search and fetches team results
 */

"use client";

import { useState } from "react";
import { useDebounce } from "~/hooks/useDebounce";
import { useAvailableTeams } from "./useTeams";
import type { Team } from "@shared";

interface UseTeamSearchResult {
  teams: Team[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/**
 * useTeamSearch provides debounced team search functionality
 * REQ-FE-714: Debounces search query by 300ms and fetches results
 *
 * @returns Object with teams, isLoading, searchQuery, and setSearchQuery
 *
 * @example
 * ```tsx
 * const { teams, isLoading, searchQuery, setSearchQuery } = useTeamSearch();
 *
 * <Input
 *   value={searchQuery}
 *   onChange={(e) => setSearchQuery(e.target.value)}
 *   placeholder="Search teams..."
 * />
 *
 * {isLoading ? (
 *   <Skeleton />
 * ) : (
 *   teams.map(team => <TeamCard key={team.id} team={team} />)
 * )}
 * ```
 */
export function useTeamSearch(): UseTeamSearchResult {
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Debounce search query by 300ms
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch teams using debounced search query
  const { data: teams = [], isLoading } = useAvailableTeams(debouncedSearch);

  return {
    teams,
    isLoading,
    searchQuery,
    setSearchQuery,
  };
}
