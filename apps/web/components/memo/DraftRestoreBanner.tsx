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
    if (!savedAt) return "previously";

    const now = new Date();
    const diffMs = now.getTime() - savedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    } else {
      return "just now";
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
          <p className="text-sm font-medium">Unsaved draft found</p>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
          You have an unsaved draft from {formatSavedTime()}. Would you like to restore it?
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onDiscard}
          className="text-xs"
        >
          Discard
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onRestore();
            setIsDismissed(true);
          }}
          className="text-xs"
        >
          Restore Draft
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export type { DraftRestoreBannerProps };
