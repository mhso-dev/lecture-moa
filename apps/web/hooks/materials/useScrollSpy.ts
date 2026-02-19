"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * useScrollSpy Hook
 * REQ-FE-317, REQ-FE-364: Track active heading based on scroll position
 *
 * Uses IntersectionObserver for performance over scroll event listeners.
 * Returns the id of the currently visible heading.
 *
 * @param headingIds - Array of heading element IDs to observe
 * @param options - Optional IntersectionObserver configuration
 * @returns The ID of the currently active heading, or null if none
 *
 * @example
 * ```tsx
 * const headings = extractHeadings(content);
 * const headingIds = headings.map(h => h.id);
 * const activeId = useScrollSpy(headingIds, {
 *   rootMargin: '-10% 0px -80% 0px'
 * });
 *
 * // Highlight active ToC item
 * tocItems.map(item => (
 *   <li className={item.id === activeId ? 'active' : ''}>
 *     {item.text}
 *   </li>
 * ));
 * ```
 */
export function useScrollSpy(
  headingIds: string[],
  options?: IntersectionObserverInit
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleHeadingsRef = useRef<Map<string, number>>(new Map());

  // Default options with rootMargin for detecting "middle" of viewport
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: "-10% 0px -80% 0px",
    threshold: 0,
    ...options,
  };

  // Update active heading based on visible headings
  const updateActiveHeading = useCallback(() => {
    const visibleHeadings = visibleHeadingsRef.current;

    if (visibleHeadings.size === 0) {
      setActiveId(null);
      return;
    }

    // Find the heading closest to the top of the viewport
    let topMostId: string | null = null;
    let topMostTop = Infinity;

    visibleHeadings.forEach((top, id) => {
      if (top < topMostTop) {
        topMostTop = top;
        topMostId = id;
      }
    });

    setActiveId(topMostId);
  }, []);

  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Clear visible headings
    visibleHeadingsRef.current.clear();

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;

          if (entry.isIntersecting) {
            // Store the bounding rect top for sorting
            visibleHeadingsRef.current.set(
              id,
              entry.boundingClientRect.top
            );
          } else {
            visibleHeadingsRef.current.delete(id);
          }
        });

        // Update active heading
        updateActiveHeading();
      },
      defaultOptions
    );

    // Observe all heading elements
    headingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      visibleHeadingsRef.current.clear();
    };
  }, [headingIds, defaultOptions, updateActiveHeading]);

  return activeId;
}
