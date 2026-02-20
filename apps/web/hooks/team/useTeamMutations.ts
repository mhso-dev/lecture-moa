"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Team } from "@shared";
import { api } from "~/lib/api";
import { teamKeys } from "./useTeams";

// Note: CreateTeamRequest and UpdateTeamRequest types should be defined in team.types.ts
// Using inline types for now based on SPEC requirements

interface CreateTeamData {
  name: string;
  description?: string;
  maxMembers?: number;
  courseIds?: string[];
}

interface UpdateTeamData {
  name?: string;
  description?: string;
  maxMembers?: number;
  courseIds?: string[];
}

/**
 * Create team
 * REQ-FE-789: POST /api/v1/teams/
 */
async function createTeam(data: CreateTeamData): Promise<Team> {
  const response = await api.post<Team>("/api/v1/teams/", data);
  return response.data;
}

/**
 * Update team
 * REQ-FE-789: PATCH /api/v1/teams/{teamId}
 */
async function updateTeam(teamId: string, data: UpdateTeamData): Promise<Team> {
  const response = await api.patch<Team>(`/api/v1/teams/${teamId}`, data);
  return response.data;
}

/**
 * Delete team
 * REQ-FE-789: DELETE /api/v1/teams/{teamId}
 */
async function deleteTeam(teamId: string): Promise<void> {
  await api.delete<void>(`/api/v1/teams/${teamId}`);
}

/**
 * useCreateTeam Hook
 * REQ-FE-789: Mutation for creating a new team
 *
 * @returns TanStack mutation for team creation
 *
 * @example
 * ```tsx
 * const createMutation = useCreateTeam();
 *
 * createMutation.mutate(
 *   {
 *     name: "Study Group",
 *     description: "Weekly study sessions",
 *     maxMembers: 10,
 *     courseIds: ["course-123"]
 *   },
 *   {
 *     onSuccess: (team) => {
 *       toast.success("Team created");
 *       router.push(`/teams/${team.id}`);
 *     },
 *     onError: (error) => {
 *       toast.error("Failed to create team");
 *     }
 *   }
 * );
 * ```
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation<Team, Error, CreateTeamData>({
    mutationFn: createTeam,
    onSuccess: () => {
      // Invalidate all team lists to refetch
      queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
    },
  });
}

/**
 * useUpdateTeam Hook
 * REQ-FE-789: Mutation for updating an existing team
 *
 * @param teamId - The team ID to update
 * @returns TanStack mutation for team update
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateTeam(teamId);
 *
 * updateMutation.mutate(
 *   {
 *     name: "Updated Name",
 *     description: "New description",
 *     maxMembers: 15
 *   },
 *   {
 *     onSuccess: (team) => {
 *       toast.success("Team updated");
 *       // Detail cache will be updated automatically
 *     },
 *     onError: () => {
 *       toast.error("Failed to update team");
 *     }
 *   }
 * );
 * ```
 */
export function useUpdateTeam(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation<Team, Error, UpdateTeamData>({
    mutationFn: (data) => updateTeam(teamId, data),
    onSuccess: (updatedTeam) => {
      // Update the detail cache
      queryClient.setQueryData(teamKeys.detail(teamId), (old: { team: Team; members: unknown[] } | undefined) => {
        if (old) {
          return { ...old, team: updatedTeam };
        }
        return old;
      });

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
    },
  });
}

/**
 * useDeleteTeam Hook
 * REQ-FE-789: Mutation for deleting a team
 *
 * @param teamId - The team ID to delete
 * @returns TanStack mutation for team deletion
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteTeam(teamId);
 *
 * const handleDelete = () => {
 *   if (confirm("Are you sure you want to delete this team?")) {
 *     deleteMutation.mutate(undefined, {
 *       onSuccess: () => {
 *         toast.success("Team deleted");
 *         router.push("/teams");
 *       },
 *       onError: () => {
 *         toast.error("Failed to delete team");
 *       }
 *     });
 *   }
 * };
 * ```
 */
export function useDeleteTeam(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => deleteTeam(teamId),
    onSuccess: () => {
      // Remove from detail cache
      queryClient.removeQueries({
        queryKey: teamKeys.detail(teamId),
      });

      // Invalidate all lists
      queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
    },
  });
}
