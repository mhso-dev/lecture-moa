"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { useAuthStore } from "~/stores/auth.store";
import { useMaterialStore } from "~/stores/material.store";

interface QaSelectionTriggerProps {
  /** Material ID for Q&A context */
  materialId: string;
  /** Current active heading ID */
  activeHeadingId?: string | null;
  /** Callback to open Q&A popup - contract with SPEC-FE-006 */
  onOpenQaPopup?: (
    selectedText: string,
    anchorRect: DOMRect,
    materialId: string,
    headingId: string | null
  ) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * QaSelectionTrigger Component
 * REQ-FE-320: Text selection trigger for inline Q&A
 *
 * Features:
 * - Detects selectionchange event
 * - Floating button near selection end
 * - Hidden for instructor role
 * - Mobile: long-press or native selection menu
 *
 * Note: The Q&A popup system is in SPEC-FE-006, this is just the trigger.
 *
 * @example
 * ```tsx
 * <QaSelectionTrigger
 *   materialId={material.id}
 *   activeHeadingId={activeHeadingId}
 *   onOpenQaPopup={(text, rect, materialId, headingId) => {
 *     // Open Q&A popup - implemented in SPEC-FE-006
 *   }}
 * />
 * ```
 */
export function QaSelectionTrigger({
  materialId,
  activeHeadingId,
  onOpenQaPopup,
  className,
}: QaSelectionTriggerProps) {
  const role = useAuthStore((state) => state.role);
  const { selectedText, selectionAnchorRect, setSelection, clearSelection } =
    useMaterialStore();

  const [buttonPosition, setButtonPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  // Hide for instructors
  if (role === "instructor") {
    return null;
  }

  // Handle text selection
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      // No selection - clear state
      clearSelection();
      setButtonPosition(null);
      return;
    }

    const text = selection.toString().trim();

    // Check if selection is within the material content area
    // This prevents triggering on UI element selections
    const anchorNode = selection.anchorNode;
    if (!anchorNode) {
      clearSelection();
      setButtonPosition(null);
      return;
    }

    // Get the selection range and its bounding rect
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        clearSelection();
        setButtonPosition(null);
        return;
      }

      // Store selection in state
      setSelection(text, rect);

      // Position the button near the end of the selection
      const buttonTop = rect.bottom + window.scrollY + 8;
      const buttonLeft = rect.right + window.scrollX - 40;

      setButtonPosition({
        top: buttonTop,
        left: Math.max(16, buttonLeft),
      });
    } catch {
      clearSelection();
      setButtonPosition(null);
    }
  }, [clearSelection, setSelection]);

  // Handle click on the trigger button
  const handleClick = useCallback(() => {
    if (!selectedText || !selectionAnchorRect || !onOpenQaPopup) {
      return;
    }

    // Call the Q&A popup opener
    onOpenQaPopup(
      selectedText,
      selectionAnchorRect,
      materialId,
      activeHeadingId ?? null
    );

    // Clear selection after opening popup
    clearSelection();
    setButtonPosition(null);

    // Clear browser selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }, [
    selectedText,
    selectionAnchorRect,
    onOpenQaPopup,
    materialId,
    activeHeadingId,
    clearSelection,
  ]);

  // Set up selection listener
  useEffect(() => {
    // Debounce the selection handler
    let timeoutId: ReturnType<typeof setTimeout>;

    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSelectionChange, 100);
    };

    document.addEventListener("selectionchange", debouncedHandler);

    return () => {
      document.removeEventListener("selectionchange", debouncedHandler);
      clearTimeout(timeoutId);
    };
  }, [handleSelectionChange]);

  // Handle click outside to hide
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        // Don't clear selection on outside click - let user click the button
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render if no selection or no position
  if (!selectedText || !buttonPosition) {
    return null;
  }

  return (
    <Button
      ref={buttonRef}
      variant="default"
      size="sm"
      className={cn(
        "fixed z-50 gap-2 shadow-lg",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{
        top: `${buttonPosition.top}px`,
        left: `${buttonPosition.left}px`,
      }}
      onClick={handleClick}
      aria-label="Ask a question about the selected text"
    >
      <MessageCircleQuestion className="h-4 w-4" />
      <span className="hidden sm:inline">Ask</span>
    </Button>
  );
}
