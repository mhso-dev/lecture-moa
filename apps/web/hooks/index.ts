/**
 * Custom Hooks Index
 * REQ-FE-025: Custom hooks for responsive behavior and scroll tracking
 * REQ-FE-002: Authentication hooks
 * REQ-FE-362: Material domain hooks
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

// Material domain hooks
export { useDebounce } from "./useDebounce";
export { useBeforeUnload } from "./useBeforeUnload";

// Material-specific hooks (re-exported from materials subdirectory)
export {
  // Query hooks
  materialKeys,
  useMaterial,
  useMaterials,
  // Mutation hooks
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  useToggleMaterialStatus,
  useUploadMaterialImage,
  // Utility hooks
  useScrollSpy,
  useReadingProgress,
} from "./materials";
