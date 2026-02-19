"use client";

import { useEffect, useState, useRef, type RefObject } from "react";

/**
 * useReadingProgress Hook
 * REQ-FE-318, REQ-FE-365: Calculate scroll-based reading progress
 *
 * Returns a number from 0 to 100 representing scroll progress.
 * Uses requestAnimationFrame for smooth updates.
 *
 * @param containerRef - Optional ref to the scroll container element
 * @returns Progress percentage (0-100)
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLElement>(null);
 * const progress = useReadingProgress(containerRef);
 *
 * return (
 *   <div
 *     role="progressbar"
 *     aria-valuenow={progress}
 *     aria-valuemin={0}
 *     aria-valuemax={100}
 *     style={{ width: `${progress}%` }}
 *   />
 * );
 * ```
 */
export function useReadingProgress(
  containerRef?: RefObject<HTMLElement | null>
): number {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const tickingRef = useRef(false);

  useEffect(() => {
    const calculateProgress = () => {
      let scrollTop: number;
      let scrollHeight: number;
      let clientHeight: number;

      if (containerRef?.current) {
        // Use the container element
        const container = containerRef.current;
        scrollTop = container.scrollTop;
        scrollHeight = container.scrollHeight;
        clientHeight = container.clientHeight;
      } else {
        // Fall back to document
        scrollTop =
          window.scrollY ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0;
        scrollHeight =
          document.documentElement.scrollHeight ||
          document.body.scrollHeight ||
          0;
        clientHeight =
          window.innerHeight ||
          document.documentElement.clientHeight ||
          document.body.clientHeight ||
          0;
      }

      // Calculate progress: 0 to 100
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) {
        setProgress(0);
        return;
      }

      const rawProgress = (scrollTop / maxScroll) * 100;
      const clampedProgress = Math.min(100, Math.max(0, rawProgress));

      setProgress(Math.round(clampedProgress));
    };

    const onScroll = () => {
      if (!tickingRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          calculateProgress();
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };

    // Initial calculation
    calculateProgress();

    // Add scroll listener
    const target = containerRef?.current || window;
    target.addEventListener("scroll", onScroll, { passive: true });

    // Also listen for resize events
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [containerRef]);

  return progress;
}
