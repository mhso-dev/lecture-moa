/**
 * CourseDangerZone Component
 * TASK-035: Course Danger Zone
 *
 * REQ-FE-436: Archive Course
 * REQ-FE-437: Delete Course
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useArchiveCourse } from "~/hooks/useArchiveCourse";
import { useDeleteCourse } from "~/hooks/useDeleteCourse";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

interface CourseDangerZoneProps {
  courseId: string;
  courseTitle: string;
  onArchive?: () => void;
  onDelete?: () => void;
}

/**
 * CourseDangerZone - Archive and delete course actions with confirmation
 */
export function CourseDangerZone({
  courseId,
  courseTitle,
  onArchive,
  onDelete,
}: CourseDangerZoneProps) {
  const router = useRouter();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");

  const archiveMutation = useArchiveCourse();
  const deleteMutation = useDeleteCourse();

  const handleArchive = () => {
    archiveMutation.mutate(
      { courseId },
      {
        onSuccess: () => {
          toast.success("Course archived successfully");
          setArchiveDialogOpen(false);
          onArchive?.();
          router.push("/courses");
        },
        onError: (error) => {
          toast.error("Failed to archive course. Please try again.");
          console.error("Archive error:", error);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { courseId },
      {
        onSuccess: () => {
          toast.success("Course deleted successfully");
          setDeleteDialogOpen(false);
          onDelete?.();
          router.push("/courses");
        },
        onError: (error) => {
          toast.error("Failed to delete course. Please try again.");
          console.error("Delete error:", error);
        },
      }
    );
  };

  const isDeleteConfirmValid = confirmTitle === courseTitle;

  return (
    <div
      data-testid="danger-zone-container"
      className="border border-destructive rounded-lg p-6 space-y-4"
    >
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Danger Zone</h3>
      </div>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        These actions are irreversible. Please proceed with caution.
      </p>

      <div className="flex gap-4">
        {/* Archive Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={archiveMutation.isPending}
              aria-label="Archive course"
            >
              {archiveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              Archive Course
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive the course &ldquo;{courseTitle}&rdquo;. Archived courses are
                hidden from the course list and students cannot access them.
                You can restore an archived course later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              aria-label="Delete course"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Course
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                course &ldquo;{courseTitle}&rdquo; including all materials, student progress,
                and associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="confirm-title">
                Type the course title to confirm: <strong>{courseTitle}</strong>
              </Label>
              <Input
                id="confirm-title"
                placeholder={courseTitle}
                value={confirmTitle}
                onChange={(e) => setConfirmTitle(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmTitle("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!isDeleteConfirmValid || deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
