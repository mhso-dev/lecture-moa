/**
 * MemberListItem Component
 * TASK-025: Member list item display component
 * REQ-FE-722: Member display with role and actions
 */

"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { useTeamMembership } from "~/hooks/team/useTeamMembership";
import type { TeamMemberDetail, TeamMemberRole } from "@shared";
import { toast } from "sonner";

interface MemberListItemProps {
  member: TeamMemberDetail;
  teamId: string;
  isCurrentUserLeader: boolean;
  currentUserId?: string;
}

/**
 * MemberListItem displays a team member's information
 * with avatar, name, role badge, and joined date.
 * Leaders can manage members via dropdown menu.
 */
export function MemberListItem({
  member,
  teamId,
  isCurrentUserLeader,
  currentUserId,
}: MemberListItemProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const { removeMember, changeMemberRole } = useTeamMembership(teamId);

  const isSelf = currentUserId === member.userId;
  const canManage = isCurrentUserLeader && !isSelf;

  // Generate avatar fallback initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date helper
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const handleRemove = () => {
    removeMember.mutate(
      { userId: member.userId },
      {
        onSuccess: () => {
          toast.success("Member removed successfully");
          setShowRemoveDialog(false);
        },
        onError: () => {
          toast.error("Failed to remove member");
        },
      }
    );
  };

  const handleRoleChange = (newRole: TeamMemberRole) => {
    changeMemberRole.mutate(
      { userId: member.userId, role: newRole },
      {
        onSuccess: () => {
          toast.success(`Role changed to ${newRole}`);
        },
        onError: () => {
          toast.error("Failed to change role");
        },
      }
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          {member.avatarUrl && <img src={member.avatarUrl} alt={member.name} />}
          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
        </Avatar>

        {/* Member info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{member.name}</span>
            <Badge
              variant={member.role === "leader" ? "default" : "secondary"}
            >
              {member.role}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Joined {formatDate(member.joinedAt)}</span>
            {isSelf && (
              <span className="text-xs text-muted-foreground">
                ({member.email})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions - only for leaders */}
      {canManage && (
        <div className="flex items-center gap-2">
          {/* Role change dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Change role">
                Change Role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {member.role === "member" && (
                <DropdownMenuItem
                  onClick={() => handleRoleChange("leader")}
                  role="option"
                >
                  Promote to Leader
                </DropdownMenuItem>
              )}
              {member.role === "leader" && (
                <DropdownMenuItem
                  onClick={() => handleRoleChange("member")}
                  role="option"
                >
                  Demote to Member
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Remove button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowRemoveDialog(true)}
            disabled={isSelf || removeMember.isPending}
            aria-label="Remove member"
          >
            Remove
          </Button>
        </div>
      )}

      {/* Remove confirmation dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent role="alertdialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {member.name} from the team? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
