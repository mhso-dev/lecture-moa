/**
 * useQuizTimer Hook - Timer State Management
 * REQ-FE-614: Timer state management for quiz-taking
 *
 * Manages setInterval lifecycle for quiz timer.
 * Calls store.tickTimer() on each tick.
 * Handles cleanup on unmount.
 */

import { useEffect, useRef, useMemo } from "react";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";
import type { TimerStatus } from "~/stores/quiz-taking.store";

interface UseQuizTimerOptions {
  onExpire?: () => void;
}

interface UseQuizTimerReturn {
  remainingSeconds: number | null;
  timerStatus: TimerStatus;
  formattedTime: string | null;
  pauseTimer: () => void;
  resumeTimer: () => void;
}

/**
 * Format seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Quiz Timer Hook
 *
 * @param options - Configuration options
 * @param options.onExpire - Callback when timer reaches 0
 * @returns Timer state and control functions
 *
 * Features:
 * - Manages setInterval lifecycle
 * - Calls store.tickTimer() every second when running
 * - Cleans up interval on unmount
 * - Provides formatted time display (MM:SS)
 * - Supports onExpire callback for auto-submit
 */
export function useQuizTimer(options?: UseQuizTimerOptions): UseQuizTimerReturn {
  const { onExpire } = options ?? {};

  // Get state and actions from store
  const remainingSeconds = useQuizTakingStore((state) => state.remainingSeconds);
  const timerStatus = useQuizTakingStore((state) => state.timerStatus);
  const tickTimer = useQuizTakingStore((state) => state.tickTimer);
  const pauseTimer = useQuizTakingStore((state) => state.pauseTimer);
  const resumeTimer = useQuizTakingStore((state) => state.resumeTimer);

  // Track previous timer status for onExpire callback
  const previousStatusRef = useRef<TimerStatus>(timerStatus);

  // Track interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle onExpire callback when status changes to expired
  useEffect(() => {
    if (
      previousStatusRef.current === "running" &&
      timerStatus === "expired" &&
      onExpire
    ) {
      onExpire();
    }
    previousStatusRef.current = timerStatus;
  }, [timerStatus, onExpire]);

  // Set up interval when timer is running
  useEffect(() => {
    if (timerStatus === "running") {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerStatus, tickTimer]);

  // Format time for display
  const formattedTime = useMemo(() => {
    if (remainingSeconds === null) {
      return null;
    }
    return formatTime(remainingSeconds);
  }, [remainingSeconds]);

  return {
    remainingSeconds,
    timerStatus,
    formattedTime,
    pauseTimer,
    resumeTimer,
  };
}
