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
    userId: user?.id || "",
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
      toast.success("Draft restored");
    }
    setShowRestoreBanner(false);
  };

  /**
   * Handle draft discard
   */
  const handleDiscardDraft = () => {
    clearDraft();
    setShowRestoreBanner(false);
    toast.info("Draft discarded");
  };

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (values: CreateMemoRequest) => {
      createMutation.mutate(values, {
        onSuccess: (memo) => {
          toast.success("Memo created successfully");
          clearDraft();
          setDirty(false);
          setLastSaved(new Date());
          router.push(`/memos/${memo.id}`);
        },
        onError: (error) => {
          toast.error("Failed to create memo");
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
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }
    router.push("/memos");
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
            aria-label="Back to memos"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Memo</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Create a personal study memo
            </p>
          </div>
        </div>

        {/* Draft saved indicator */}
        {lastSavedAt && (
          <div className="text-sm text-[var(--color-muted-foreground)]">
            Draft saved
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
