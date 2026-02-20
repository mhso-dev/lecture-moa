/**
 * InviteMemberModal Component
 * TASK-026: Member invitation modal
 * REQ-FE-722: Email-based member invitation
 */

/* eslint-disable @typescript-eslint/no-deprecated */
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useTeamMembership } from "~/hooks/team/useTeamMembership";
import { toast } from "sonner";

interface InviteMemberModalProps {
  teamId: string;
  open: boolean;
  onClose: () => void;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * InviteMemberModal allows team leaders to invite
 * new members via email.
 */
export function InviteMemberModal({
  teamId,
  open,
  onClose,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { inviteMember } = useTeamMembership(teamId);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setEmail("");
      setError(null);
    }
  }, [open]);

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setError("Email is required");
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setError("Please enter a valid email address");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    inviteMember.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          toast.success("Invitation sent successfully");
          onClose();
        },
        onError: () => {
          toast.error("Failed to send invitation");
        },
      }
    );
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (error) {
      validateEmail(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" role="dialog">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Enter the email address of the person you want to invite to your
            team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => { handleEmailChange(e.target.value); }}
                aria-invalid={!!error}
                aria-describedby={error ? "email-error" : undefined}
              />
              {error && (
                <p id="email-error" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={inviteMember.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteMember.isPending || !email.trim()}
            >
              {inviteMember.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
