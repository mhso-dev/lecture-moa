/**
 * FocusWarningDialog Component
 * REQ-FE-618: Anti-Cheat Focus Detection
 *
 * Warning dialog shown when focus loss is detected
 */

"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { cn } from "~/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface FocusWarningDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Custom className */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Focus Warning Dialog Component
 *
 * Warning modal shown when focus loss is detected:
 * - "Focus loss detected" title
 * - "This event has been recorded." message
 * - Single "Continue Quiz" button
 *
 * @param props - Component props
 * @returns Focus warning dialog component
 *
 * @example
 * ```tsx
 * <FocusWarningDialog
 *   open={showWarning}
 *   onOpenChange={setShowWarning}
 * />
 * ```
 */
export function FocusWarningDialog({
  open,
  onOpenChange,
  className,
  testId,
}: FocusWarningDialogProps): React.JSX.Element {
  const handleContinue = () => {
    onOpenChange(false);
  };

  // Focus the continue button when dialog opens
  const actionRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open) {
      // Small delay to ensure button is rendered
      const timer = setTimeout(() => {
        actionRef.current?.focus();
      }, 0);
      return () => { clearTimeout(timer); };
    }
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn("max-w-md border-destructive/50", className)}
        data-testid={testId}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <svg
              data-testid="warning-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            포커스 이탈 감지됨
          </AlertDialogTitle>
          <AlertDialogDescription aria-live="assertive">
            <p>
              퀴즈 창을 벗어났습니다. 이 이벤트는 기록되며
              강사에게 보고될 수 있습니다.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end">
          <AlertDialogAction
            ref={actionRef}
            onClick={handleContinue}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            퀴즈 계속하기
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
