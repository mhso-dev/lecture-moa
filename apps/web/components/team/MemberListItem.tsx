/**
 * MemberListItem Component
 * TASK-025: Member list item display component
 * REQ-FE-722: Member display with role and actions
 */

/* eslint-disable @typescript-eslint/no-unnecessary-condition */
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
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const handleRemove = () => {
    removeMember.mutate(
      { userId: member.userId },
      {
        onSuccess: () => {
          toast.success("멤버가 제거되었습니다");
          setShowRemoveDialog(false);
        },
        onError: () => {
          toast.error("멤버 제거에 실패했습니다");
        },
      }
    );
  };

  const handleRoleChange = (newRole: TeamMemberRole) => {
    changeMemberRole.mutate(
      { userId: member.userId, role: newRole },
      {
        onSuccess: () => {
          toast.success(`역할이 ${newRole === "leader" ? "리더" : "멤버"}(으)로 변경되었습니다`);
        },
        onError: () => {
          toast.error("역할 변경에 실패했습니다");
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
            <span>{formatDate(member.joinedAt)} 가입</span>
            {isSelf && (
              <span className="text-xs text-muted-foreground">
                (나)
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
              <Button variant="outline" size="sm" aria-label="역할 변경">
                역할 변경
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {member.role === "member" && (
                <DropdownMenuItem
                  onClick={() => { handleRoleChange("leader"); }}
                  role="option"
                >
                  리더로 승격
                </DropdownMenuItem>
              )}
              {member.role === "leader" && (
                <DropdownMenuItem
                  onClick={() => { handleRoleChange("member"); }}
                  role="option"
                >
                  멤버로 변경
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Remove button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { setShowRemoveDialog(true); }}
            disabled={isSelf || removeMember.isPending}
            aria-label="멤버 제거"
          >
            제거
          </Button>
        </div>
      )}

      {/* Remove confirmation dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent role="alertdialog">
          <AlertDialogHeader>
            <AlertDialogTitle>멤버를 제거하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {member.name}님을 팀에서 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? "제거 중..." : "제거"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
