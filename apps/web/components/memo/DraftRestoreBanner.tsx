/* eslint-disable @typescript-eslint/restrict-template-expressions */
/**
 * DraftRestoreBanner Component
 * REQ-FE-764: Dismissible banner for draft restoration
 *
 * Features:
 * - Shown when draft exists in localStorage
 * - "Restore Draft" button loads draft into editor
 * - "Discard" button clears localStorage draft
 * - Uses useAutoSaveDraft hook
 */

"use client";

import { useState } from "react";
import { AlertCircle, FileText, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

/**
 * Props for DraftRestoreBanner component
 */
interface DraftRestoreBannerProps {
  /** Whether a draft exists */
  hasDraft: boolean;
  /** Timestamp when draft was saved */
  savedAt: Date | null;
  /** Callback to restore draft */
  onRestore: () => void;
  /** Callback to discard draft */
  onDiscard: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DraftRestoreBanner - Banner for draft restoration prompt
 * REQ-FE-764: Dismissible banner at top of editor
 *
 * @param props - Component props
 * @returns DraftRestoreBanner component or null
 *
 * @example
 * ```tsx
 * <DraftRestoreBanner
 *   hasDraft={hasDraft}
 *   savedAt={lastSavedAt}
 *   onRestore={handleRestore}
 *   onDiscard={handleDiscard}
 * />
 * ```
 */
export function DraftRestoreBanner({
  hasDraft,
  savedAt,
  onRestore,
  onDiscard,
  className,
}: DraftRestoreBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't render if no draft or dismissed
  if (!hasDraft || isDismissed) {
    return null;
  }

  /**
   * Format saved time
   */
  const formatSavedTime = () => {
    if (!savedAt) return "이전";

    const now = new Date();
    const diffMs = now.getTime() - savedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}일 전`;
    } else if (diffHours > 0) {
      return `${diffHours}시간 전`;
    } else if (diffMins > 0) {
      return `${diffMins}분 전`;
    } else {
      return "방금 전";
    }
  };

  /**
   * Handle dismiss
   */
  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 text-[var(--color-primary)] flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          <p className="text-sm font-medium">저장되지 않은 임시저장본이 있습니다</p>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
          {formatSavedTime()}에 저장된 임시저장본이 있습니다. 복원하시겠습니까?
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onDiscard}
          className="text-xs"
        >
          삭제
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onRestore();
            setIsDismissed(true);
          }}
          className="text-xs"
        >
          임시저장본 복원
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleDismiss}
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export type { DraftRestoreBannerProps };
