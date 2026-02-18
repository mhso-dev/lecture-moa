/**
 * Custom Hooks Index
 * REQ-FE-025: Custom hooks for responsive behavior and scroll tracking
 * REQ-FE-002: Authentication hooks
 */

export {
  useMediaQuery,
  useMatchMedia,
  BREAKPOINTS,
} from "./useMediaQuery";

export type { UseMediaQueryReturn } from "./useMediaQuery";

export {
  useScrollPosition,
  useIsScrolled,
  useScrollToTop,
} from "./useScrollPosition";

export type { ScrollPosition, UseScrollPositionOptions } from "./useScrollPosition";

export { useAuth } from "./useAuth";
export { useCurrentUser } from "./useCurrentUser";
