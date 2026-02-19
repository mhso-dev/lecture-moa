/**
 * useAutoSaveDraft Hook
 * REQ-FE-763: Auto-save draft memos to localStorage
 *
 * Features:
 * - Auto-saves every 30 seconds using useDebounce
 * - Storage key: `memo-draft-${userId}-${memoId}`
 * - Returns savedDraft, hasDraft, saveDraft, clearDraft, restoreDraft, lastSavedAt
 * - Draft saved indicator logic handled by component
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "~/hooks/useDebounce";

/**
 * Draft data structure
 */
interface MemoDraft {
  title: string;
  content: string;
  tags: string[];
  materialId: string | null;
  anchorId: string | null;
  savedAt: string;
}

/**
 * Props for useAutoSaveDraft hook
 */
interface UseAutoSaveDraftProps {
  /** User ID for storage key */
  userId: string;
  /** Memo ID (use "new" for new memos) */
  memoId: string;
  /** Current title value */
  title: string;
  /** Current content value */
  content: string;
  /** Current tags value */
  tags: string[];
  /** Current materialId value */
  materialId: string | null;
  /** Current anchorId value */
  anchorId: string | null;
  /** Auto-save interval in milliseconds (default: 30000) */
  interval?: number;
}

/**
 * Return type for useAutoSaveDraft hook
 */
interface UseAutoSaveDraftReturn {
  /** Whether a draft exists in localStorage */
  hasDraft: boolean;
  /** The saved draft data (if any) */
  savedDraft: MemoDraft | null;
  /** Timestamp of last save */
  lastSavedAt: Date | null;
  /** Manually save draft */
  saveDraft: () => void;
  /** Clear draft from localStorage */
  clearDraft: () => void;
  /** Restore draft from localStorage */
  restoreDraft: () => MemoDraft | null;
}

/**
 * Generate storage key for draft
 */
function getStorageKey(userId: string, memoId: string): string {
  return `memo-draft-${userId}-${memoId}`;
}

/**
 * useAutoSaveDraft - Auto-save draft memos to localStorage
 * REQ-FE-763: Auto-saves draft every 30 seconds
 *
 * @param props - Hook props
 * @returns Draft state and actions
 *
 * @example
 * ```tsx
 * const {
 *   hasDraft,
 *   savedDraft,
 *   lastSavedAt,
 *   saveDraft,
 *   clearDraft,
 *   restoreDraft,
 * } = useAutoSaveDraft({
 *   userId: user.id,
 *   memoId: memoId || "new",
 *   title,
 *   content,
 *   tags,
 *   materialId,
 *   anchorId,
 * });
 *
 * // Check for existing draft on mount
 * useEffect(() => {
 *   if (hasDraft) {
 *     setShowRestoreBanner(true);
 *   }
 * }, []);
 *
 * // Show "Draft saved" indicator
 * {lastSavedAt && (
 *   <span className="text-xs text-muted-foreground">
 *     Draft saved {formatDistanceToNow(lastSavedAt)} ago
 *   </span>
 * )}
 * ```
 */
export function useAutoSaveDraft({
  userId,
  memoId,
  title,
  content,
  tags,
  materialId,
  anchorId,
  interval = 30000,
}: UseAutoSaveDraftProps): UseAutoSaveDraftReturn {
  const [savedDraft, setSavedDraft] = useState<MemoDraft | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const storageKey = getStorageKey(userId, memoId);

  // Debounce values for auto-save
  const debouncedTitle = useDebounce(title, interval);
  const debouncedContent = useDebounce(content, interval);
  const debouncedTags = useDebounce(tags, interval);
  const debouncedMaterialId = useDebounce(materialId, interval);
  const debouncedAnchorId = useDebounce(anchorId, interval);

  /**
   * Save draft to localStorage
   */
  const saveDraft = useCallback(() => {
    const draft: MemoDraft = {
      title,
      content,
      tags,
      materialId,
      anchorId,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setSavedDraft(draft);
      setLastSavedAt(new Date());
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [storageKey, title, content, tags, materialId, anchorId]);

  /**
   * Clear draft from localStorage
   */
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSavedDraft(null);
      setLastSavedAt(null);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  }, [storageKey]);

  /**
   * Restore draft from localStorage
   */
  const restoreDraft = useCallback((): MemoDraft | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const draft = JSON.parse(stored) as MemoDraft;
        setSavedDraft(draft);
        setLastSavedAt(new Date(draft.savedAt));
        return draft;
      }
    } catch (error) {
      console.error("Failed to restore draft:", error);
    }
    return null;
  }, [storageKey]);

  /**
   * Check for existing draft on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const draft = JSON.parse(stored) as MemoDraft;
        setSavedDraft(draft);
        setLastSavedAt(new Date(draft.savedAt));
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  }, [storageKey]);

  /**
   * Auto-save when debounced values change
   */
  useEffect(() => {
    // Only auto-save if there's content
    if (debouncedTitle || debouncedContent) {
      saveDraft();
    }
  }, [
    debouncedTitle,
    debouncedContent,
    debouncedTags,
    debouncedMaterialId,
    debouncedAnchorId,
    saveDraft,
  ]);

  return {
    hasDraft: savedDraft !== null,
    savedDraft,
    lastSavedAt,
    saveDraft,
    clearDraft,
    restoreDraft,
  };
}

export type { UseAutoSaveDraftProps, UseAutoSaveDraftReturn, MemoDraft };
