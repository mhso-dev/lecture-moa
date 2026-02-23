/**
 * InviteMemberModal Component
 * @deprecated Email-based invitation removed in SPEC-BE-006.
 * Use invite code-based joining (useJoinTeam) instead.
 * This component is kept as a stub to avoid import breakage.
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

interface InviteMemberModalProps {
  teamId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * @deprecated Use invite code sharing instead of email-based invitation.
 * This modal is a stub preserved for backward compatibility.
 */
export function InviteMemberModal({
  open,
  onClose,
}: InviteMemberModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" role="dialog">
        <DialogHeader>
          <DialogTitle>초대 코드 공유</DialogTitle>
          <DialogDescription>
            이메일 기반 초대가 초대 코드 공유 방식으로 변경되었습니다.
            팀 초대 코드를 새 멤버에게 공유해 주세요.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
