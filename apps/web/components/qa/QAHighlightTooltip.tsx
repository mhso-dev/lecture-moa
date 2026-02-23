"use client";

/**
 * QAHighlightTooltip Component
 * REQ-FE-009: Tooltip popup for Q&A highlighted text
 *
 * Renders a floating tooltip near highlighted <mark> elements,
 * showing the linked Q&A questions with their status and title.
 *
 * Features:
 * - Portal-based rendering for z-index isolation
 * - Viewport-aware positioning (below/above mark element)
 * - Escape key to close
 * - Click outside to close
 * - WCAG 2.1 AA: role="dialog", aria-label, keyboard navigation
 */

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import { useActiveHighlight, useQAStore } from "~/stores/qa.store";
import { useQADetail } from "~/hooks/qa";
import { QAStatusBadge } from "./QAStatusBadge";
import { cn } from "~/lib/utils";
import type { QAStatus } from "@shared";

const TOOLTIP_WIDTH = 320;
const TOOLTIP_MAX_HEIGHT = 280;
const PADDING = 8;

/**
 * Single question item within the tooltip
 */
function QuestionItem({ questionId }: { questionId: string }) {
  const { data: question, isLoading } = useQADetail(questionId);

  if (isLoading) {
    return (
      <div className="animate-pulse py-2 px-3">
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    );
  }

  if (!question) return null;

  return (
    <a
      href={`#question-${questionId}`}
      className={cn(
        "block py-2 px-3 rounded-md transition-colors",
        "hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-primary"
      )}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <QAStatusBadge status={question.status as QAStatus} className="text-[10px] px-1.5 py-0" />
        <span className="text-xs text-muted-foreground">
          {question.upvoteCount > 0 && `+${question.upvoteCount}`}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground line-clamp-2">
        {question.title}
      </p>
    </a>
  );
}

/**
 * Calculate tooltip position relative to anchor
 */
function calculateTooltipPosition(anchorRect: DOMRect): { top: number; left: number } {
  const scrollTop = window.scrollY;
  const scrollLeft = window.scrollX;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Default: below the highlight
  let top = anchorRect.bottom + scrollTop + PADDING;
  let left = anchorRect.left + scrollLeft;

  // Check vertical overflow
  const spaceBelow = viewportHeight - anchorRect.bottom;
  if (spaceBelow < TOOLTIP_MAX_HEIGHT && anchorRect.top > spaceBelow) {
    // Flip above
    top = anchorRect.top + scrollTop - TOOLTIP_MAX_HEIGHT - PADDING;
  }

  // Check horizontal overflow
  if (left + TOOLTIP_WIDTH > viewportWidth + scrollLeft) {
    left = viewportWidth + scrollLeft - TOOLTIP_WIDTH - PADDING;
  }
  if (left < scrollLeft + PADDING) {
    left = scrollLeft + PADDING;
  }

  return { top, left };
}

/**
 * QAHighlightTooltip - Floating tooltip for highlighted Q&A text
 *
 * Reads activeHighlight from QA store and renders a tooltip
 * with the linked question(s).
 */
export function QAHighlightTooltip() {
  const activeHighlight = useActiveHighlight();
  const closeHighlightTooltip = useQAStore((s) => s.closeHighlightTooltip);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeHighlightTooltip();
      }
    },
    [closeHighlightTooltip]
  );

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        closeHighlightTooltip();
      }
    },
    [closeHighlightTooltip]
  );

  useEffect(() => {
    if (!activeHighlight) return;

    document.addEventListener("keydown", handleKeyDown);
    // Delay click listener to avoid closing immediately on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(timer);
    };
  }, [activeHighlight, handleKeyDown, handleClickOutside]);

  if (!activeHighlight) return null;

  const { anchorRect, questionIds } = activeHighlight;
  const position = calculateTooltipPosition(anchorRect);

  return createPortal(
    <div
      ref={tooltipRef}
      role="dialog"
      aria-label={`${questionIds.length}개의 질문`}
      className={cn(
        "fixed z-50 bg-popover text-popover-foreground",
        "border border-border rounded-lg shadow-lg",
        "overflow-hidden"
      )}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        width: TOOLTIP_WIDTH,
        maxHeight: TOOLTIP_MAX_HEIGHT,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>
            {questionIds.length}개의 질문
          </span>
        </div>
        <button
          type="button"
          onClick={closeHighlightTooltip}
          className="p-0.5 rounded hover:bg-muted transition-colors"
          aria-label="닫기"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Question list */}
      <div className="overflow-y-auto" style={{ maxHeight: TOOLTIP_MAX_HEIGHT - 44 }}>
        {questionIds.map((qId) => (
          <QuestionItem key={qId} questionId={qId} />
        ))}
      </div>
    </div>,
    document.body
  );
}
