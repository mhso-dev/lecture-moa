"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Scroll position state
 */
export interface ScrollPosition {
  /** Current scroll X position */
  x: number;
  /** Current scroll Y position */
  y: number;
  /** Scroll direction: 'up' | 'down' | null */
  direction: "up" | "down" | null;
  /** Whether user has scrolled past the initial position */
  isScrolled: boolean;
}

/**
 * Hook options
 */
export interface UseScrollPositionOptions {
  /** Threshold in pixels to consider as "scrolled" (default: 10) */
  threshold?: number;
  /** Throttle delay in milliseconds (default: 100) */
  throttleMs?: number;
  /** Whether to track scroll direction (default: true) */
  trackDirection?: boolean;
}

/**
 * useScrollPosition Hook
 *
 * Tracks scroll position for sticky header effects and scroll-based UI.
 * SSR-safe: returns default values on server.
 * Throttled updates for performance.
 *
 * @param options - Configuration options
 * @returns Scroll position state
 *
 * @example
 * ```tsx
 * const { y, direction, isScrolled } = useScrollPosition({ threshold: 50 });
 *
 * return (
 *   <header className={cn(
 *     "sticky top-0 transition-shadow",
 *     isScrolled && "shadow-md"
 *   )}>
 *     ...
 *   </header>
 * );
 * ```
 */
export function useScrollPosition(
  options: UseScrollPositionOptions = {}
): ScrollPosition {
  const { threshold = 10, throttleMs = 100, trackDirection = true } = options;

  // SSR-safe initial state
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
    x: 0,
    y: 0,
    direction: null,
    isScrolled: false,
  });

  const [isClient, setIsClient] = useState(false);
  const previousY = useRef(0);
  const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateScrollPosition = useCallback(() => {
    if (typeof window === "undefined") return;

    const currentX = window.scrollX;
    const currentY = window.scrollY;

    // Determine scroll direction
    let direction: "up" | "down" | null = null;
    if (trackDirection && previousY.current !== currentY) {
      direction = currentY > previousY.current ? "down" : "up";
    }

    previousY.current = currentY;

    setScrollPosition({
      x: currentX,
      y: currentY,
      direction,
      isScrolled: currentY > threshold,
    });
  }, [threshold, trackDirection]);

  useEffect(() => {
    setIsClient(true);

    // Initial position update
    updateScrollPosition();

    // Throttled scroll handler
    const handleScroll = () => {
      if (throttleTimeout.current) {
        return;
      }

      throttleTimeout.current = setTimeout(() => {
        updateScrollPosition();
        throttleTimeout.current = null;
      }, throttleMs);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
      }
    };
  }, [throttleMs, updateScrollPosition]);

  // SSR: return default state
  if (!isClient) {
    return {
      x: 0,
      y: 0,
      direction: null,
      isScrolled: false,
    };
  }

  return scrollPosition;
}

/**
 * Simplified hook for just checking if scrolled past threshold
 *
 * @param threshold - Pixels scrolled to trigger (default: 0)
 * @returns Whether scrolled past threshold
 */
export function useIsScrolled(threshold = 0): boolean {
  const { isScrolled } = useScrollPosition({ threshold });
  return isScrolled;
}

/**
 * Hook for scroll-to-top functionality
 *
 * @returns Object with scrollToTop function and isAtTop boolean
 */
export function useScrollToTop() {
  const { y } = useScrollPosition();

  const scrollToTop = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior });
  }, []);

  return {
    scrollToTop,
    isAtTop: y === 0,
  };
}
