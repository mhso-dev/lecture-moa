"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TeamMemberRole } from "@shared";
import { useAuth } from "~/hooks/useAuth";
import {
  joinTeamByInviteCode,
  leaveTeam,
  removeMember,
  changeMemberRole,
} from "~/lib/supabase/teams";
import { teamKeys } from "./useTeams";

/**
 * Join team response
 */
interface JoinTeamResponse {
  teamId: string;
}

/**
 * useJoinTeam Hook
 * REQ-BE-006-022, REQ-BE-006-029: Standalone hook for joining a team by invite code
 * Used in Browse Teams section where invite code is provided by user
 *
 * @returns Mutation hook for joining a team via invite code
 *
 * @example
 * ```tsx
 * const { mutate: joinTeam, isPending } = useJoinTeam();
 *
 * joinTeam(inviteCode, {
 *   onSuccess: ({ teamId }) => {
 *     toast.success("Joined team");
 *     router.push(`/teams/${teamId}`);
 *   },
 *   onError: (error) => toast.error(error.message)
 * });
 * ```
 */
export function useJoinTeam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<JoinTeamResponse, Error, string>({
    mutationFn: (inviteCode: string) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- user existence guaranteed before mutate call
      joinTeamByInviteCode(inviteCode, user!.id),
    onSuccess: (data) => {
      // Invalidate team detail and members
      void queryClient.invalidateQueries({
        queryKey: teamKeys.detail(data.teamId),
      });
      void queryClient.invalidateQueries({
        queryKey: teamKeys.members(data.teamId),
      });
      // Also invalidate team lists (my teams will change)
      void queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
    },
  });
}

/**
 * useTeamMembership Hook
 * REQ-BE-006-025 ~ REQ-BE-006-028: Hook encapsulating team membership mutation logic via Supabase
 *
 * Provides mutations for:
 * - leaveTeam: Leave a team
 * - removeMember: Remove member from team (leader action)
 * - changeMemberRole: Change member role
 *
 * NOTE: inviteMember (email-based) has been removed per SPEC-BE-006.
 * Use useJoinTeam with invite code instead.
 *
 * @param teamId - The team ID for membership operations
 *
 * @example
 * ```tsx
 * const { leaveTeam, removeMember, changeMemberRole } =
 *   useTeamMembership(teamId);
 *
 * // Leave team
 * leaveTeam.mutate(undefined, {
 *   onSuccess: () => {
 *     toast.success("Left team");
 *     router.push("/teams");
 *   }
 * });
 *
 * // Remove member
 * removeMember.mutate({ userId: "user-123" }, {
 *   onSuccess: () => toast.success("Member removed")
 * });
 *
 * // Change role
 * changeMemberRole.mutate(
 *   { userId: "user-123", role: "leader" },
 *   { onSuccess: () => toast.success("Role updated") }
 * );
 * ```
 */
export function useTeamMembership(teamId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const leaveTeamMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- user existence guaranteed before mutate call
    mutationFn: () => leaveTeam(teamId, user!.id),
    onSuccess: () => {
      // Invalidate all team-related data
      void queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
      // Remove detail cache since we're no longer a member
      queryClient.removeQueries({
        queryKey: teamKeys.detail(teamId),
      });
    },
  });

  const removeMemberMutation = useMutation<unknown, Error, { userId: string }>({
    mutationFn: ({ userId }) => removeMember(teamId, userId),
    onSuccess: () => {
      // Invalidate members list
      void queryClient.invalidateQueries({
        queryKey: teamKeys.members(teamId),
      });
      // Also invalidate team detail (member count changed)
      void queryClient.invalidateQueries({
        queryKey: teamKeys.detail(teamId),
      });
    },
  });

  const changeMemberRoleMutation = useMutation<
    unknown,
    Error,
    { userId: string; role: TeamMemberRole }
  >({
    mutationFn: ({ userId, role }) => changeMemberRole(teamId, userId, role),
    onSuccess: () => {
      // Invalidate members list
      void queryClient.invalidateQueries({
        queryKey: teamKeys.members(teamId),
      });
    },
  });

  return {
    leaveTeam: leaveTeamMutation,
    removeMember: removeMemberMutation,
    changeMemberRole: changeMemberRoleMutation,
  };
}
