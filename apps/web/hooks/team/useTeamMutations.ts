"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Team } from "@shared";
import { useAuth } from "~/hooks/useAuth";
import {
  createTeam,
  updateTeam,
  deleteTeam,
} from "~/lib/supabase/teams";
import { teamKeys } from "./useTeams";

// Note: CreateTeamData and UpdateTeamData types should be defined in team.types.ts
// Using inline types for now based on SPEC requirements

interface CreateTeamData {
  name: string;
  description?: string;
  maxMembers?: number;
  courseId?: string;
}

interface UpdateTeamData {
  name?: string;
  description?: string;
  maxMembers?: number;
}

/**
 * useCreateTeam Hook
 * REQ-BE-006-017, REQ-BE-006-018: Mutation for creating a new team via Supabase
 * Creates team with invite_code and adds creator as leader.
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
 *     courseId: "course-123"
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
  const { user } = useAuth();

  return useMutation<Team, Error, CreateTeamData>({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- user existence guaranteed before mutate call
    mutationFn: (data) => createTeam(data, user!.id),
    onSuccess: () => {
      // Invalidate all team lists to refetch
      void queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
    },
  });
}

/**
 * useUpdateTeam Hook
 * REQ-BE-006-019: Mutation for updating an existing team via Supabase
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
      void queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
    },
  });
}

/**
 * useDeleteTeam Hook
 * REQ-BE-006-020: Mutation for deleting a team via Supabase
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

  return useMutation({
    mutationFn: () => deleteTeam(teamId),
    onSuccess: () => {
      // Remove from detail cache
      queryClient.removeQueries({
        queryKey: teamKeys.detail(teamId),
      });

      // Invalidate all lists
      void queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
    },
  });
}
