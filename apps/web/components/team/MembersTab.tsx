/**
 * MembersTab Component
 * TASK-027: Members tab content
 * REQ-FE-722: Member list with invite functionality
 */

/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-deprecated */
"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useTeamMembers } from "~/hooks/team/useTeam";
import { useAuthStore } from "~/stores/auth.store";
import { MemberListItem } from "./MemberListItem";
import { InviteMemberModal } from "./InviteMemberModal";
import { Plus, Users } from "lucide-react";

interface MembersTabProps {
  teamId: string;
  currentUserId?: string;
}

/**
 * MembersTab displays the list of team members
 * with invite functionality for leaders.
 */
export function MembersTab({ teamId, currentUserId }: MembersTabProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { data: members, isLoading, error } = useTeamMembers(teamId);
  const user = useAuthStore((state) => state.user);

  // Determine if current user is a leader
  const isCurrentUserLeader = members?.some(
    (m) => m.userId === (currentUserId || user?.id) && m.role === "leader"
  );

  if (isLoading) {
    return (
      <div data-testid="members-loading-skeleton" className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">Failed to load members</h3>
        <p className="text-muted-foreground">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">No members yet</h3>
        <p className="text-muted-foreground mb-4">
          Invite people to join your team.
        </p>
        {isCurrentUserLeader && (
          <Button onClick={() => { setShowInviteModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with member count and invite button */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>
        {isCurrentUserLeader && (
          <Button onClick={() => { setShowInviteModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Member list */}
      <div className="divide-y">
        {members.map((member) => (
          <MemberListItem
            key={member.id}
            member={member}
            teamId={teamId}
            isCurrentUserLeader={isCurrentUserLeader ?? false}
            currentUserId={currentUserId || user?.id}
          />
        ))}
      </div>

      {/* Invite modal */}
      <InviteMemberModal
        teamId={teamId}
        open={showInviteModal}
        onClose={() => { setShowInviteModal(false); }}
      />
    </div>
  );
}
