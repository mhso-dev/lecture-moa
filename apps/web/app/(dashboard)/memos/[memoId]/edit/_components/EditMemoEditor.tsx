/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * EditMemoEditor Client Component
 * REQ-FE-765: Interactive editor for editing existing memos
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
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
import { MemoEditorWrapper } from "~/components/memo/MemoEditorWrapper";
import { DraftRestoreBanner } from "~/components/memo/DraftRestoreBanner";
import { useBeforeUnload } from "~/hooks/useBeforeUnload";
import { useAutoSaveDraft } from "~/hooks/memo/useAutoSaveDraft";
import { useMemoDetail, useUpdateMemo, useDeleteMemo } from "~/hooks/memo/useMemoDetail";
import { useAuthStore } from "~/stores/auth.store";
import { useMemoEditorStore } from "~/stores/memo.store";
import type { UpdateMemoRequest } from "@shared/types/memo.types";

/**
 * EditMemoEditor - Editor for editing existing memos
 * REQ-FE-765: Update memo with auto-save and draft restoration
 * REQ-FE-768: Delete memo with confirmation
 */
export function EditMemoEditor() {
  const router = useRouter();
  const params = useParams();
  const memoId = params.memoId as string;
  const user = useAuthStore((state) => state.user);
  const { isDirty, setDirty, setLastSaved } = useMemoEditorStore();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  // Fetch existing memo
  const { data: memoData, isLoading, isError } = useMemoDetail(memoId);

  // Mutations
  const updateMutation = useUpdateMemo(memoId);
  const deleteMutation = useDeleteMemo();

  // Auto-save draft (30 seconds)
  const {
    hasDraft,
    savedDraft,
    lastSavedAt,
    clearDraft,
    restoreDraft,
  } = useAutoSaveDraft({
    userId: user?.id ?? "",
    memoId,
    title,
    content,
    tags,
    materialId,
    anchorId,
    interval: 30000,
  });

  // Initialize form with memo data
  useEffect(() => {
    if (memoData?.memo) {
      const memo = memoData.memo;
      setTitle(memo.title);
      setContent(memo.content);
      setTags(memo.tags);
      setMaterialId(memo.materialId);
      setAnchorId(memo.anchorId);

      // Check if there's a newer draft
      if (hasDraft && savedDraft) {
        const draftTime = new Date(savedDraft.savedAt).getTime();
        const memoTime = new Date(memo.updatedAt).getTime();
        if (draftTime > memoTime) {
          setShowRestoreBanner(true);
        }
      }
    }
  }, [memoData, hasDraft, savedDraft]);

  // Warn before navigating away with unsaved changes
  useBeforeUnload(isDirty);

  /**
   * Handle draft restoration
   */
  const handleRestoreDraft = () => {
    const draft = restoreDraft();
    if (draft) {
      setTitle(draft.title);
      setContent(draft.content);
      setTags(draft.tags);
      setMaterialId(draft.materialId);
      setAnchorId(draft.anchorId);
      setDirty(true);
      toast.success("임시저장본이 복원되었습니다");
    }
    setShowRestoreBanner(false);
  };

  /**
   * Handle draft discard
   */
  const handleDiscardDraft = () => {
    clearDraft();
    setShowRestoreBanner(false);
    toast.info("임시저장본이 삭제되었습니다");
  };

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (values: UpdateMemoRequest) => {
      updateMutation.mutate(values, {
        onSuccess: () => {
          toast.success("메모가 저장되었습니다");
          clearDraft();
          setDirty(false);
          setLastSaved(new Date());
        },
        onError: (error) => {
          toast.error("메모 저장에 실패했습니다");
          console.error("Update memo error:", error);
        },
      });
    },
    [updateMutation, clearDraft, setDirty, setLastSaved]
  );

  /**
   * Handle delete
   */
  const handleDelete = () => {
    deleteMutation.mutate(memoId, {
      onSuccess: () => {
        toast.success("메모가 삭제되었습니다");
        clearDraft();
        router.push("/memos" as any);
      },
      onError: (error) => {
        toast.error("메모 삭제에 실패했습니다");
        console.error("Delete memo error:", error);
      },
    });
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?"
      );
      if (!confirmed) return;
    }
    router.push(`/memos/${memoId}` as any);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 px-4 md:px-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Show error state
  if (isError || !memoData?.memo) {
    return (
      <div className="container max-w-4xl py-6 px-4 md:px-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">메모를 찾을 수 없습니다</h2>
          <p className="text-[var(--color-muted-foreground)] mb-6">
            찾으시는 메모가 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <Button onClick={() => { router.push("/memos" as any); }}>
            메모 목록으로
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is author
  const isAuthor = memoData.memo.authorId === user?.id;
  if (!isAuthor) {
    router.push(`/memos/${memoId}` as any);
    return null;
  }

  return (
    <div className="container max-w-4xl py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            aria-label="메모로 돌아가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">메모 편집</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              메모를 수정하세요
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Draft saved indicator */}
          {lastSavedAt && (
            <div className="text-sm text-[var(--color-muted-foreground)]">
              임시저장 완료
            </div>
          )}

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setShowDeleteDialog(true); }}
            className="text-[var(--color-destructive)]"
            aria-label="메모 삭제"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Draft Restore Banner */}
      {showRestoreBanner && (
        <div className="mb-6">
          <DraftRestoreBanner
            hasDraft={hasDraft}
            savedAt={lastSavedAt}
            onRestore={handleRestoreDraft}
            onDiscard={handleDiscardDraft}
          />
        </div>
      )}

      {/* Memo Editor */}
      <MemoEditorWrapper
        initialValues={{
          title,
          content,
          tags,
          materialId: materialId ?? undefined,
          anchorId: anchorId ?? undefined,
          visibility: memoData.memo.visibility,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메모를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              "{memoData.memo.title}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[var(--color-destructive)]/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
