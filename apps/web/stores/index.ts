/**
 * Stores Index
 * REQ-FE-025: Zustand stores for state management
 * REQ-FE-321: Material viewer state store
 */

export {
  useNavigationStore,
  useSidebarCollapsed,
  useMobileMenuOpen,
  useActiveRoute,
} from "./navigation.store";

export { useAuthStore } from "./auth.store";

export {
  useUIStore,
  useActiveModal,
  useIsLoading,
  useLoadingMessage,
} from "./ui.store";

export {
  useMaterialStore,
  useActiveHeading,
  useIsTocOpen,
  useFontSize,
  useIsFullscreen,
  useTextSelection,
} from "./material.store";

export {
  useCourseStore,
  useCourseViewMode,
  useCourseSearchQuery,
  useCourseSelectedCategory,
  useCourseSortOption,
} from "./course.store";
