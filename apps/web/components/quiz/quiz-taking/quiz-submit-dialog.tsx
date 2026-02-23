/**
 * QuizSubmitDialog Component
 * REQ-FE-617: Quiz Submission
 *
 * Confirmation dialog before submitting quiz
 */

"use client";

import * as React from "react";
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
import { cn } from "~/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface QuizSubmitDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Number of answered questions */
  answeredCount: number;
  /** Total number of questions */
  totalCount: number;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Custom className */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Quiz Submit Dialog Component
 *
 * Confirmation dialog shown before submitting quiz:
 * - Shows answered/total count
 * - Warns if questions are unanswered
 * - "Confirm Submit" and "Continue Quiz" buttons
 * - Focus trapped within dialog
 *
 * @param props - Component props
 * @returns Submit dialog component
 *
 * @example
 * ```tsx
 * <QuizSubmitDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   answeredCount={8}
 *   totalCount={10}
 *   onConfirm={handleSubmit}
 * />
 * ```
 */
export function QuizSubmitDialog({
  open,
  onOpenChange,
  answeredCount,
  totalCount,
  onConfirm,
  isSubmitting = false,
  className,
  testId,
}: QuizSubmitDialogProps): React.JSX.Element {
  const unansweredCount = totalCount - answeredCount;
  const hasUnanswered = unansweredCount > 0;

  const handleConfirm = () => {
    if (!isSubmitting) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn("max-w-md", className)}
        data-testid={testId}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>퀴즈를 제출하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {totalCount}개 문항 중 {answeredCount}개에 응답했습니다.
              </p>
              {hasUnanswered && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span className="font-medium">
                    경고: 미응답 문항이 {unansweredCount}개 있습니다.
                  </span>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            퀴즈 계속하기
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  data-testid="loading-spinner"
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                제출 중...
              </span>
            ) : (
              "제출 확인"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
