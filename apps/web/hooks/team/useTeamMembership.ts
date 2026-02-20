"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TeamMemberRole, TeamMemberDetail } from "@shared";
import { api } from "~/lib/api";
import { teamKeys } from "./useTeams";

/**
 * Join team request
 */
interface JoinTeamResponse {
  teamId: string;
  message: string;
}

/**
 * Invite member request
 */
interface InviteMemberData {
  email: string;
}

/**
 * Join a team
 * REQ-FE-727: POST /api/v1/teams/{teamId}/join
 */
async function joinTeam(teamId: string): Promise<JoinTeamResponse> {
  const response = await api.post<JoinTeamResponse>(
    `/api/v1/teams/${teamId}/join`
  );
  return response.data;
}

/**
 * Leave a team
 * REQ-FE-727: DELETE /api/v1/teams/{teamId}/leave
 */
async function leaveTeam(teamId: string): Promise<void> {
  await api.delete<void>(`/api/v1/teams/${teamId}/leave`);
}

/**
 * Invite a member by email
 * REQ-FE-727: POST /api/v1/teams/{teamId}/members/invite
 */
async function inviteMember(
  teamId: string,
  email: string
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(
    `/api/v1/teams/${teamId}/members/invite`,
    { email }
  );
  return response.data;
}

/**
 * Remove a member from team
 * REQ-FE-727: DELETE /api/v1/teams/{teamId}/members/{userId}
 */
async function removeMember(teamId: string, userId: string): Promise<void> {
  await api.delete<void>(`/api/v1/teams/${teamId}/members/${userId}`);
}

/**
 * Change member role
 * REQ-FE-727: PATCH /api/v1/teams/{teamId}/members/{userId}
 */
async function changeMemberRole(
  teamId: string,
  userId: string,
  role: TeamMemberRole
): Promise<TeamMemberDetail> {
  const response = await api.patch<TeamMemberDetail>(
    `/api/v1/teams/${teamId}/members/${userId}`,
    { role }
  );
  return response.data;
}

/**
 * useTeamMembership Hook
 * REQ-FE-727: Hook encapsulating team membership mutation logic
 *
 * Provides mutations for:
 * - joinTeam: Join a team
 * - leaveTeam: Leave a team
 * - inviteMember: Invite member by email
 * - removeMember: Remove member from team
 * - changeMemberRole: Change member role
 *
 * @param teamId - The team ID for membership operations
 *
 * @example
 * ```tsx
 * const { joinTeam, leaveTeam, inviteMember, removeMember, changeMemberRole } =
 *   useTeamMembership(teamId);
 *
 * // Join team
 * joinTeam.mutate(undefined, {
 *   onSuccess: () => toast.success("Joined team"),
 *   onError: () => toast.error("Failed to join team")
 * });
 *
 * // Leave team
 * leaveTeam.mutate(undefined, {
 *   onSuccess: () => {
 *     toast.success("Left team");
 *     router.push("/teams");
 *   }
 * });
 *
 * // Invite member
 * inviteMember.mutate({ email: "user@example.com" }, {
 *   onSuccess: () => toast.success("Invitation sent")
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
/**
 * useJoinTeam Hook
 * REQ-FE-712: Standalone hook for joining any team by ID
 * Used in Browse Teams section where teamId varies
 *
 * @returns Mutation hook for joining a team
 *
 * @example
 * ```tsx
 * const { mutate: joinTeam, isPending } = useJoinTeam();
 *
 * joinTeam(teamId, {
 *   onSuccess: () => toast.success("Joined team"),
 *   onError: () => toast.error("Failed to join team")
 * });
 * ```
 */
export function useJoinTeam() {
  const queryClient = useQueryClient();

  return useMutation<JoinTeamResponse, Error, string>({
    mutationFn: (teamId: string) => joinTeam(teamId),
    onSuccess: (_, teamId) => {
      // Invalidate team detail and members
      queryClient.invalidateQueries({
        queryKey: teamKeys.detail(teamId),
      });
      queryClient.invalidateQueries({
        queryKey: teamKeys.members(teamId),
      });
      // Also invalidate team lists (my teams will change)
      queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
    },
  });
}

export function useTeamMembership(teamId: string) {
  const queryClient = useQueryClient();

  const joinTeamMutation = useMutation<JoinTeamResponse, Error, void>({
    mutationFn: () => joinTeam(teamId),
    onSuccess: () => {
      // Invalidate team detail and members
      queryClient.invalidateQueries({
        queryKey: teamKeys.detail(teamId),
      });
      queryClient.invalidateQueries({
        queryKey: teamKeys.members(teamId),
      });
      // Also invalidate team lists (my teams will change)
      queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
    },
  });

  const leaveTeamMutation = useMutation<void, Error, void>({
    mutationFn: () => leaveTeam(teamId),
    onSuccess: () => {
      // Invalidate all team-related data
      queryClient.invalidateQueries({
        queryKey: teamKeys.lists(),
      });
      // Remove detail cache since we're no longer a member
      queryClient.removeQueries({
        queryKey: teamKeys.detail(teamId),
      });
    },
  });

  const inviteMemberMutation = useMutation<{ message: string }, Error, InviteMemberData>({
    mutationFn: ({ email }) => inviteMember(teamId, email),
    onSuccess: () => {
      // Invalidate members list to show pending invitations
      queryClient.invalidateQueries({
        queryKey: teamKeys.members(teamId),
      });
    },
  });

  const removeMemberMutation = useMutation<void, Error, { userId: string }>({
    mutationFn: ({ userId }) => removeMember(teamId, userId),
    onSuccess: () => {
      // Invalidate members list
      queryClient.invalidateQueries({
        queryKey: teamKeys.members(teamId),
      });
      // Also invalidate team detail (member count changed)
      queryClient.invalidateQueries({
        queryKey: teamKeys.detail(teamId),
      });
    },
  });

  const changeMemberRoleMutation = useMutation<
    TeamMemberDetail,
    Error,
    { userId: string; role: TeamMemberRole }
  >({
    mutationFn: ({ userId, role }) => changeMemberRole(teamId, userId, role),
    onSuccess: () => {
      // Invalidate members list
      queryClient.invalidateQueries({
        queryKey: teamKeys.members(teamId),
      });
    },
  });

  return {
    joinTeam: joinTeamMutation,
    leaveTeam: leaveTeamMutation,
    inviteMember: inviteMemberMutation,
    removeMember: removeMemberMutation,
    changeMemberRole: changeMemberRoleMutation,
  };
}
