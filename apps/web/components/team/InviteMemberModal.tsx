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
          <DialogTitle>Share Invite Code</DialogTitle>
          <DialogDescription>
            Email-based invitation has been replaced with invite code sharing.
            Share your team invite code with new members instead.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
