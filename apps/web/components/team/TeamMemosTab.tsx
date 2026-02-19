/**
 * Team Memos Tab Component
 * REQ-FE-724: Wrapper for TeamMemoBoard with WebSocket initialization
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeamMemoBoard } from "./TeamMemoBoard";
import { useTeamMemoSocket } from "~/hooks/team/useTeamMemoSocket";
import { useTeam } from "~/hooks/team/useTeam";
import { useAuth } from "~/hooks/useAuth";
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
import { useDeleteMemo } from "~/hooks/memo/useMemoDetail";
import { toast } from "sonner";
import type { TeamMemberRole } from "@shared/types/dashboard.types";

/**
 * Props for TeamMemosTab component
 */
interface TeamMemosTabProps {
  /** Team ID */
  teamId: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * TeamMemosTab - Memos tab content for team detail page
 * REQ-FE-724: Wraps TeamMemoBoard and initializes WebSocket
 *
 * Responsibilities:
 * - Initialize WebSocket connection via useTeamMemoSocket
 * - Pass teamId to TeamMemoBoard
 * - Handle memo editing and deletion
 *
 * @param props - Component props
 * @returns TeamMemosTab component
 *
 * @example
 * ```tsx
 * <TabsContent value="memos">
 *   <TeamMemosTab teamId={teamId} />
 * </TabsContent>
 * ```
 */
export function TeamMemosTab({ teamId, className }: TeamMemosTabProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: teamData } = useTeam(teamId);
  const { status: socketStatus } = useTeamMemoSocket(teamId);
  const deleteMemo = useDeleteMemo();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memoToDelete, setMemoToDelete] = useState<string | null>(null);

  /**
   * Get current user's role in the team
   */
  const currentUserRole: TeamMemberRole | undefined = teamData?.members.find(
    (member) => member.id === user?.id
  )?.role;

  /**
   * Handle edit memo navigation
   */
  const handleEditMemo = (memoId: string) => {
    router.push(`/memos/${memoId}/edit`);
  };

  /**
   * Handle delete memo click
   */
  const handleDeleteMemo = (memoId: string) => {
    setMemoToDelete(memoId);
    setShowDeleteDialog(true);
  };

  /**
   * Confirm memo deletion
   */
  const confirmDelete = async () => {
    if (!memoToDelete) return;

    try {
      await deleteMemo.mutateAsync({ memoId: memoToDelete });
      toast.success("Memo deleted successfully");
      setShowDeleteDialog(false);
      setMemoToDelete(null);
    } catch (error) {
      toast.error("Failed to delete memo");
      console.error("[TeamMemosTab] Delete error:", error);
    }
  };

  return (
    <>
      <TeamMemoBoard
        teamId={teamId}
        currentUserRole={currentUserRole}
        socketStatus={socketStatus}
        onEditMemo={handleEditMemo}
        onDeleteMemo={handleDeleteMemo}
        className={className}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Memo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The memo will be permanently removed
              from the team board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMemo.isPending}
            >
              {deleteMemo.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export type { TeamMemosTabProps };
