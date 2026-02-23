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
          toast.success("강의가 보관 처리되었습니다");
          setArchiveDialogOpen(false);
          onArchive?.();
          router.push("/courses");
        },
        onError: (error) => {
          toast.error("강의 보관 처리에 실패했습니다. 다시 시도해 주세요.");
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
          toast.success("강의가 삭제되었습니다");
          setDeleteDialogOpen(false);
          onDelete?.();
          router.push("/courses");
        },
        onError: (error) => {
          toast.error("강의 삭제에 실패했습니다. 다시 시도해 주세요.");
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
        <h3 className="text-lg font-semibold">위험 구역</h3>
      </div>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        이 작업은 되돌릴 수 없습니다. 신중하게 진행해 주세요.
      </p>

      <div className="flex gap-4">
        {/* Archive Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={archiveMutation.isPending}
              aria-label="강의 보관"
            >
              {archiveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              강의 보관
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 보관하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                강의 &ldquo;{courseTitle}&rdquo;을(를) 보관 처리합니다. 보관된 강의는
                강의 목록에서 숨겨지며 학생들이 접근할 수 없습니다.
                나중에 보관된 강의를 복원할 수 있습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>
                확인
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
              aria-label="강의 삭제"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              강의 삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>강의 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. 강의 &ldquo;{courseTitle}&rdquo;의
                모든 자료, 학생 진도, 관련 데이터가 영구적으로 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="confirm-title">
                확인을 위해 강의 제목을 입력하세요: <strong>{courseTitle}</strong>
              </Label>
              <Input
                id="confirm-title"
                placeholder={courseTitle}
                value={confirmTitle}
                onChange={(e) => { setConfirmTitle(e.target.value); }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setConfirmTitle(""); }}>
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!isDeleteConfirmValid || deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                영구 삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
