/**
 * QuizTimer Component
 * REQ-FE-614: Quiz Timer
 *
 * Countdown timer with color states and accessibility features
 */

"use client";

import * as React from "react";
import { useQuizTimer } from "~/hooks/quiz/useQuizTimer";
import { cn } from "~/lib/utils";
import type { TimerStatus } from "~/stores/quiz-taking.store";

// ============================================================================
// Types
// ============================================================================

export interface QuizTimerProps {
  /** Remaining seconds (null if no timer) */
  remainingSeconds: number | null;
  /** Current timer status */
  status: TimerStatus;
  /** Callback when timer expires */
  onExpire?: () => void;
  /** Custom className */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format seconds to MM:SS format
 * For values >= 60 minutes, displays as H:MM:SS or total minutes
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Get aria-live value based on remaining time
 * - Normal (>120s): off
 * - Warning (120s): polite
 * - Critical (<60s): assertive
 */
function getAriaLive(seconds: number): "off" | "polite" | "assertive" {
  if (seconds <= 60) return "assertive";
  if (seconds <= 120) return "polite";
  return "off";
}

/**
 * Get screen reader announcement for threshold changes
 */
function getAnnouncement(seconds: number): string | null {
  if (seconds === 120) return "2 minutes remaining";
  if (seconds === 60) return "1 minute remaining";
  return null;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Quiz Timer Component
 *
 * Displays countdown timer with:
 * - MM:SS format
 * - Color states: default -> amber (120s) -> red (60s)
 * - Pulse animation below 60s
 * - ARIA live announcements for threshold changes
 *
 * @param props - Component props
 * @returns Timer component or null if no timer
 *
 * @example
 * ```tsx
 * <QuizTimer remainingSeconds={300} status="running" onExpire={handleSubmit} />
 * ```
 */
export function QuizTimer({
  remainingSeconds: propRemainingSeconds,
  status: _propStatus,
  onExpire,
  className,
  testId,
}: QuizTimerProps): React.JSX.Element | null {
  // Use the hook for timer management
  const hookValues = useQuizTimer({ onExpire });

  // Use hook values when available, fall back to props for testing
  // Note: Props are used when the hook is mocked in tests
  const displaySeconds = hookValues.remainingSeconds ?? propRemainingSeconds;
  const displayStatus = hookValues.timerStatus;
  const formattedTime = hookValues.formattedTime;

  // Don't render if no timer
  if (displaySeconds === null) {
    return null;
  }

  // Format time if hook doesn't provide it
  const timeDisplay = formattedTime ?? formatTime(displaySeconds);

  // Determine color state
  const isAmber = displaySeconds <= 120 && displaySeconds > 60;
  const isRed = displaySeconds <= 60;
  const showPulse = displaySeconds < 60 && displaySeconds > 0;

  // Get aria-live value
  const ariaLive = getAriaLive(displaySeconds);

  // Get announcement for screen readers
  const announcement = getAnnouncement(displaySeconds);

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid={testId}>
      {/* Timer display */}
      <div
        role="timer"
        aria-label="Time remaining"
        aria-live={ariaLive}
        className={cn(
          "text-2xl font-mono font-bold tabular-nums transition-colors",
          isAmber && "text-amber-500",
          isRed && "text-red-500",
          showPulse && "animate-pulse"
        )}
      >
        {timeDisplay}
      </div>

      {/* Status indicator */}
      {displayStatus === "paused" && (
        <span className="text-sm text-muted-foreground">(Paused)</span>
      )}
      {displayStatus === "expired" && (
        <span className="text-sm text-red-500 font-medium">(Time's up!)</span>
      )}

      {/* Screen reader announcement */}
      {announcement && (
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      )}
    </div>
  );
}
