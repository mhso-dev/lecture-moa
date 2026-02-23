"use client";

/**
 * Material Editor Page
 * REQ-FE-350, 358: Instructor-only markdown editor with full editing capabilities
 *
 * Features:
 * - Instructor-only route guard
 * - Fetches existing material content on load via TanStack Query
 * - Full editor integration with live preview
 * - Autosave to localStorage
 * - Save Draft and Save and Publish buttons
 * - Image paste/upload
 * - Conflict detection
 * - Unsaved changes warning
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Send,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useAuthStore } from "~/stores/auth.store";
import { materialKeys } from "~/hooks/materials/useMaterial";
import { useUpdateMaterial } from "~/hooks/materials/useUpdateMaterial";
import { useUploadMaterialImage } from "~/hooks/materials/useUploadMaterialImage";
import { EditorWithPreview, EditorWithPreviewRef } from "~/components/markdown";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { sanitizeMarkdown } from "~/lib/markdown";
import { fetchMaterial, toMaterial } from "~/lib/supabase/materials";
import type { Material, MaterialStatus } from "@shared";

// LocalStorage key for drafts
const getDraftKey = (materialId: string) => `material-draft-${materialId}`;

// Autosave interval (30 seconds)
const AUTOSAVE_INTERVAL = 30 * 1000;

interface DraftData {
  content: string;
  savedAt: string;
  title: string;
}

/**
 * Save draft to localStorage
 */
function saveDraft(materialId: string, content: string, title: string): void {
  const draft: DraftData = {
    content: sanitizeMarkdown(content),
    savedAt: new Date().toISOString(),
    title,
  };
  localStorage.setItem(getDraftKey(materialId), JSON.stringify(draft));
}

/**
 * Load draft from localStorage
 */
function loadDraft(materialId: string): DraftData | null {
  const data = localStorage.getItem(getDraftKey(materialId));
  if (!data) return null;

  try {
    return JSON.parse(data) as DraftData;
  } catch {
    return null;
  }
}

/**
 * Clear draft from localStorage
 */
function clearDraft(materialId: string): void {
  localStorage.removeItem(getDraftKey(materialId));
}

/**
 * Format relative time (simple implementation without date-fns)
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "방금 전";
  } else if (diffMin < 60) {
    return `${String(diffMin)}분 전`;
  } else if (diffHour < 24) {
    return `${String(diffHour)}시간 전`;
  } else if (diffDay < 7) {
    return `${String(diffDay)}일 전`;
  } else {
    return date.toLocaleDateString();
  }
}

export default function MaterialEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const editorRef = useRef<EditorWithPreviewRef>(null);

  const courseId = params.courseId as string;
  const materialId = params.materialId as string;

  // Auth state
  const { role } = useAuthStore();

  // Fetch material data
  const {
    data: material,
    isLoading,
    error,
  } = useQuery<Material>({
    queryKey: materialKeys.detail(courseId, materialId),
    queryFn: async () => {
      const row = await fetchMaterial(courseId, materialId);
      return toMaterial(row);
    },
    enabled: !!courseId && !!materialId,
    staleTime: 0, // Always fetch fresh data for editing
  });

  // Mutations
  const updateMutation = useUpdateMaterial(courseId);
  const imageUploadMutation = useUploadMaterialImage(courseId);

  // Editor state
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [originalUpdatedAt, setOriginalUpdatedAt] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Dialog states
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<MaterialStatus | null>(null);

  // Initialize content from material data
  useEffect(() => {
    if (material) {
      setContent(material.content);
      setTitle(material.title);
      setOriginalUpdatedAt(material.updatedAt);

      // Check for draft
      const draft = loadDraft(materialId);
      if (draft) {
        const draftTime = new Date(draft.savedAt).getTime();
        const serverTime = new Date(material.updatedAt).getTime();

        if (draftTime > serverTime) {
          setShowRestoreDialog(true);
        }
      }
    }
  }, [material, materialId]);

  // Track dirty state
  useEffect(() => {
    if (material) {
      setIsDirty(content !== material.content || title !== material.title);
      if (content !== material.content || title !== material.title) {
        setAutosaveStatus("unsaved");
      }
    }
  }, [content, title, material]);

  // Autosave
  useEffect(() => {
    if (!isDirty || !material) return;

    const interval = setInterval(() => {
      setAutosaveStatus("saving");
      saveDraft(materialId, content, title);
      setAutosaveStatus("saved");
      setLastSaved(new Date().toISOString());
    }, AUTOSAVE_INTERVAL);

    return () => { clearInterval(interval); };
  }, [isDirty, content, title, materialId, material]);

  // Handle image upload
  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      try {
        const result = await imageUploadMutation.mutateAsync({ materialId, file });
        return result.url;
      } catch (error) {
        console.error("Image upload failed:", error);
        throw error;
      }
    },
    [imageUploadMutation, materialId]
  );

  // Restore draft
  const handleRestoreDraft = useCallback(() => {
    const draft = loadDraft(materialId);
    if (draft) {
      setContent(draft.content);
      setTitle(draft.title);
      setAutosaveStatus("saved");
      setLastSaved(draft.savedAt);
    }
    setShowRestoreDialog(false);
  }, [materialId]);

  // Discard draft
  const handleDiscardDraft = useCallback(() => {
    clearDraft(materialId);
    setShowRestoreDialog(false);
  }, [materialId]);

  // Check for conflicts before save
  const checkForConflicts = useCallback(async (): Promise<boolean> => {
    if (!originalUpdatedAt) return false;

    try {
      // Refetch to get current server state
      const row = await fetchMaterial(courseId, materialId);
      const currentMaterial = toMaterial(row);

      if (currentMaterial.updatedAt !== originalUpdatedAt) {
        setShowConflictDialog(true);
        return true;
      }
    } catch (error) {
      console.error("Failed to check for conflicts:", error);
    }

    return false;
  }, [courseId, materialId, originalUpdatedAt]);

  // Save material
  const handleSave = useCallback(
    async (status?: MaterialStatus) => {
      if (!material) return;

      // Check for conflicts
      const hasConflict = await checkForConflicts();
      if (hasConflict) return;

      // If trying to publish a draft, show confirmation
      if (status === "published" && material.status === "draft") {
        setPendingStatus(status);
        setShowPublishDialog(true);
        return;
      }

      const newStatus = status ?? material.status;

      try {
        await updateMutation.mutateAsync({
          id: materialId,
          title,
          content: sanitizeMarkdown(content),
          status: newStatus,
        });

        // Clear draft after successful save
        clearDraft(materialId);
        setOriginalUpdatedAt(new Date().toISOString());
        setIsDirty(false);
        setAutosaveStatus("saved");
        setLastSaved(new Date().toISOString());

        // Invalidate query to refresh cache
        void queryClient.invalidateQueries({
          queryKey: materialKeys.detail(courseId, materialId),
        });

        // Show success toast
        // TODO: Implement toast notification
        console.log("Material saved successfully");
      } catch (error) {
        console.error("Failed to save material:", error);
        // TODO: Show error toast
      }
    },
    [
      material,
      materialId,
      title,
      content,
      updateMutation,
      checkForConflicts,
      queryClient,
      courseId,
    ]
  );

  // Confirm publish
  const handleConfirmPublish = useCallback(() => {
    setShowPublishDialog(false);
    if (pendingStatus) {
      void handleSave(pendingStatus);
    }
    setPendingStatus(null);
  }, [pendingStatus, handleSave]);

  // Overwrite with local changes
  const handleOverwrite = useCallback(async () => {
    setShowConflictDialog(false);
    // Continue with save
    await updateMutation.mutateAsync({
      id: materialId,
      title,
      content: sanitizeMarkdown(content),
    });

    clearDraft(materialId);
    setOriginalUpdatedAt(new Date().toISOString());
    setIsDirty(false);
    setAutosaveStatus("saved");
    setLastSaved(new Date().toISOString());

    void queryClient.invalidateQueries({
      queryKey: materialKeys.detail(courseId, materialId),
    });
  }, [materialId, title, content, updateMutation, queryClient, courseId]);

  // Discard local changes
  const handleDiscardChanges = useCallback(() => {
    if (material) {
      setContent(material.content);
      setTitle(material.title);
      setOriginalUpdatedAt(material.updatedAt);
      clearDraft(materialId);
      setIsDirty(false);
      setAutosaveStatus("saved");
    }
    setShowConflictDialog(false);
  }, [material, materialId]);

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => { window.removeEventListener("beforeunload", handleBeforeUnload); };
  }, [isDirty]);

  // Redirect non-instructors
  useEffect(() => {
    if (role && role !== "instructor") {
      router.push(`/courses/${courseId}/materials`);
    }
  }, [role, router, courseId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  // Error state
  if (error || !material) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-[var(--color-error-500)]" />
        <h2 className="text-xl font-semibold">자료를 불러오지 못했습니다</h2>
        <Button
          variant="outline"
          onClick={() => { router.push(`/courses/${courseId}/materials`); }}
        >
          자료 목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Navigation and title */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { router.push(`/courses/${courseId}/materials/${materialId}`); }}
                aria-label="자료로 돌아가기"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold truncate">
                  편집: {material.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      autosaveStatus === "saving" && "text-[var(--color-warning-500)]",
                      autosaveStatus === "saved" && lastSaved && "text-[var(--color-success-500)]"
                    )}
                  >
                    {autosaveStatus === "saving" && (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        저장 중...
                      </>
                    )}
                    {autosaveStatus === "saved" && lastSaved && (
                      <>{formatRelativeTime(lastSaved)}에 저장됨</>
                    )}
                    {autosaveStatus === "unsaved" && "저장되지 않은 변경사항"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => { void handleSave(material.status); }}
                disabled={!isDirty || updateMutation.isPending}
                loading={updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                초안 저장
              </Button>
              <Button
                variant="default"
                onClick={() => { void handleSave("published"); }}
                disabled={updateMutation.isPending}
                loading={updateMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                저장 및 게시
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <EditorWithPreview
          ref={editorRef}
          value={content}
          onChange={setContent}
          height="calc(100vh - 200px)"
          showPreview={true}
          onImageUpload={handleImageUpload}
          placeholder="자료 내용을 작성하세요..."
        />
      </main>

      {/* Restore Draft Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>초안을 복원하시겠습니까?</DialogTitle>
            <DialogDescription>
              이전 세션에서 저장되지 않은 변경사항이 있습니다.
              복원하거나 삭제할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardDraft}>
              초안 삭제
            </Button>
            <Button onClick={handleRestoreDraft}>초안 복원</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--color-warning-500)]" />
              충돌 감지됨
            </DialogTitle>
            <DialogDescription>
              편집을 시작한 이후 다른 사람이 이 자료를 수정했습니다.
              저장하면 상대방의 변경사항을 덮어쓸 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardChanges}>
              <RefreshCw className="h-4 w-4 mr-2" />
              내 변경사항 취소
            </Button>
            <Button variant="destructive" onClick={() => { void handleOverwrite(); }}>
              덮어쓰기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>자료를 게시하시겠습니까?</DialogTitle>
            <DialogDescription>
              게시하면 강의의 모든 학생에게 이 자료가 공개됩니다.
              정말 게시하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowPublishDialog(false); }}
            >
              취소
            </Button>
            <Button onClick={handleConfirmPublish}>
              <Send className="h-4 w-4 mr-2" />
              게시
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
