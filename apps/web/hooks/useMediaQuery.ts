"use client";

import { useEffect, useState } from "react";

/**
 * Breakpoint definitions matching design tokens
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1280,
  desktop: 1280,
} as const;

/**
 * Hook return type
 */
export interface UseMediaQueryReturn {
  /** Whether viewport is mobile (<768px) */
  isMobile: boolean;
  /** Whether viewport is tablet (768px - 1279px) */
  isTablet: boolean;
  /** Whether viewport is desktop (>=1280px) */
  isDesktop: boolean;
  /** Current breakpoint category */
  breakpoint: "mobile" | "tablet" | "desktop";
}

/**
 * useMediaQuery Hook
 *
 * Detects viewport size and returns breakpoint information.
 * SSR-safe: returns default values on server, updates on client hydration.
 *
 * Breakpoints:
 * - Mobile: <768px
 * - Tablet: 768px - 1279px
 * - Desktop: >=1280px
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop } = useMediaQuery();
 *
 * if (isMobile) {
 *   return <BottomTab />;
 * }
 * ```
 */
export function useMediaQuery(): UseMediaQueryReturn {
  // SSR-safe initial state - default to mobile for better mobile-first experience
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();

    // Throttled resize handler
    let timeoutId: ReturnType<typeof setTimeout>;
    const throttledResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", throttledResize);
    return () => {
      window.removeEventListener("resize", throttledResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // SSR: Return mobile as default (mobile-first approach)
  if (!isClient) {
    return {
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      breakpoint: "mobile",
    };
  }

  const { width } = windowSize;

  if (width >= BREAKPOINTS.desktop) {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: "desktop",
    };
  }

  if (width >= BREAKPOINTS.mobile) {
    return {
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      breakpoint: "tablet",
    };
  }

  return {
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    breakpoint: "mobile",
  };
}

/**
 * Alternative hook for custom media queries
 *
 * @param query - CSS media query string
 * @returns Whether the media query matches
 *
 * @example
 * ```tsx
 * const isWide = useMatchMedia("(min-width: 1920px)");
 * ```
 */
export function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const media = window.matchMedia(query);

    const updateMatch = (e: MediaQueryListEvent | MediaQueryList) => {
      setMatches(e.matches);
    };

    // Set initial value
    updateMatch(media);

    // Listen for changes
    media.addEventListener("change", updateMatch);
    return () => { media.removeEventListener("change", updateMatch); };
  }, [query]);

  // SSR: return false
  return isClient ? matches : false;
}
