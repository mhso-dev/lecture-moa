/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * NewMemoEditor Client Component
 * REQ-FE-760: Interactive editor for new memos
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { MemoEditorWrapper } from "~/components/memo/MemoEditorWrapper";
import { DraftRestoreBanner } from "~/components/memo/DraftRestoreBanner";
import { useBeforeUnload } from "~/hooks/useBeforeUnload";
import { useAutoSaveDraft } from "~/hooks/memo/useAutoSaveDraft";
import { useCreateMemo } from "~/hooks/memo/useMemoDetail";
import { useAuthStore } from "~/stores/auth.store";
import { useMemoEditorStore } from "~/stores/memo.store";
import type { CreateMemoRequest } from "@shared/types/memo.types";

/**
 * NewMemoEditor - Editor for creating new memos
 * REQ-FE-765: Create memo with auto-save and draft restoration
 */
export function NewMemoEditor() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { isDirty, setDirty, setLastSaved } = useMemoEditorStore();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [anchorId, setAnchorId] = useState<string | null>(null);

  // Draft restoration state
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  // Create memo mutation
  const createMutation = useCreateMemo();

  // Auto-save draft (30 seconds)
  const {
    hasDraft,
    lastSavedAt,
    clearDraft,
    restoreDraft,
  } = useAutoSaveDraft({
    userId: user?.id ?? "",
    memoId: "new",
    title,
    content,
    tags,
    materialId,
    anchorId,
    interval: 30000,
  });

  // Check for existing draft on mount
  useEffect(() => {
    if (hasDraft) {
      setShowRestoreBanner(true);
    }
  }, [hasDraft]);

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
    (values: CreateMemoRequest) => {
      createMutation.mutate(values, {
        onSuccess: (memo) => {
          toast.success("메모가 생성되었습니다");
          clearDraft();
          setDirty(false);
          setLastSaved(new Date());
          router.push(`/memos/${memo.id}` as any);
        },
        onError: (error) => {
          toast.error("메모 생성에 실패했습니다");
          console.error("Create memo error:", error);
        },
      });
    },
    [createMutation, clearDraft, setDirty, setLastSaved, router]
  );

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
    router.push("/memos" as any);
  };

  // Show loading if user not loaded
  if (!user) {
    return (
      <div className="container max-w-4xl py-6 px-4 md:px-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
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
            aria-label="메모 목록으로"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">새 메모</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              개인 학습 메모 작성
            </p>
          </div>
        </div>

        {/* Draft saved indicator */}
        {lastSavedAt && (
          <div className="text-sm text-[var(--color-muted-foreground)]">
            임시저장 완료
          </div>
        )}
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
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
