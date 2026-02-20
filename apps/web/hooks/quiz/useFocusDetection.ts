/**
 * useFocusDetection Hook
 * REQ-FE-618: Anti-Cheat Focus Detection
 *
 * Detects focus loss during quiz taking including:
 * - Tab switches (visibilitychange)
 * - Window focus loss (blur)
 * - Only attaches listeners when enabled
 * - Shows warning modal on focus loss
 * - Tracks focus loss count
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";

// ============================================================================
// Types
// ============================================================================

export interface UseFocusDetectionOptions {
  enabled: boolean; // focusLossWarning from quiz settings
  onFocusLoss?: () => void;
}

export interface UseFocusDetectionReturn {
  focusLossCount: number;
  isWarningOpen: boolean;
  closeWarning: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Focus detection hook for anti-cheat functionality
 *
 * @param options - Configuration options
 * @returns Focus detection state and control functions
 *
 * Features:
 * - Detects tab switches (visibilitychange)
 * - Detects window focus loss (blur)
 * - Only active when enabled=true
 * - Shows warning modal on focus loss
 * - Includes focusLossCount in auto-save payload
 */
export function useFocusDetection({
  enabled,
  onFocusLoss,
}: UseFocusDetectionOptions): UseFocusDetectionReturn {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const incrementFocusLoss = useQuizTakingStore((state) => state.incrementFocusLoss);
  const focusLossCount = useQuizTakingStore((state) => state.focusLossCount);

  // Track if listeners are currently attached
  const listenersAttachedRef = useRef(false);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const blurHandlerRef = useRef<(() => void) | null>(null);

  // Handle focus loss
  const handleFocusLoss = useCallback(() => {
    incrementFocusLoss();
    setIsWarningOpen(true);
    onFocusLoss?.();
  }, [incrementFocusLoss, onFocusLoss]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      handleFocusLoss();
    }
  }, [handleFocusLoss]);

  // Handle window blur
  const handleBlur = useCallback(() => {
    handleFocusLoss();
  }, [handleFocusLoss]);

  // Close warning modal
  const closeWarning = useCallback(() => {
    setIsWarningOpen(false);
  }, []);

  // Attach/detach listeners based on enabled state
  useEffect(() => {
    if (enabled && !listenersAttachedRef.current) {
      // Attach listeners
      visibilityHandlerRef.current = handleVisibilityChange;
      blurHandlerRef.current = handleBlur;

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleBlur);
      listenersAttachedRef.current = true;
    } else if (!enabled && listenersAttachedRef.current) {
      // Detach listeners
      if (visibilityHandlerRef.current) {
        document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
      }
      if (blurHandlerRef.current) {
        window.removeEventListener("blur", blurHandlerRef.current);
      }
      listenersAttachedRef.current = false;
    }

    // Cleanup on unmount
    return () => {
      if (listenersAttachedRef.current) {
        if (visibilityHandlerRef.current) {
          document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
        }
        if (blurHandlerRef.current) {
          window.removeEventListener("blur", blurHandlerRef.current);
        }
        listenersAttachedRef.current = false;
      }
    };
  }, [enabled, handleVisibilityChange, handleBlur]);

  // Update handlers when they change (without re-attaching)
  useEffect(() => {
    if (listenersAttachedRef.current) {
      // Remove old handlers
      if (visibilityHandlerRef.current) {
        document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
      }
      if (blurHandlerRef.current) {
        window.removeEventListener("blur", blurHandlerRef.current);
      }

      // Attach new handlers
      visibilityHandlerRef.current = handleVisibilityChange;
      blurHandlerRef.current = handleBlur;

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleBlur);
    }
  }, [handleVisibilityChange, handleBlur]);

  return {
    focusLossCount,
    isWarningOpen,
    closeWarning,
  };
}
