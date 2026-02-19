/**
 * Custom Hooks Index
 * REQ-FE-025: Custom hooks for responsive behavior and scroll tracking
 * REQ-FE-002: Authentication hooks
 * REQ-FE-005: Course query hooks
 * REQ-FE-414-FE-437: Course mutation hooks
 */

// Responsive and scroll hooks
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

// Authentication hooks
export { useAuth } from "./useAuth";
export { useCurrentUser } from "./useCurrentUser";

// Course query hooks
export { useCourses } from "./useCourses";
export { useCourse } from "./useCourse";
export { useCourseProgress } from "./useCourseProgress";
export { useCourseStudents } from "./useCourseStudents";

// Course mutation hooks
export { useEnrollCourse } from "./useEnrollCourse";
export { useEnrollWithCode } from "./useEnrollWithCode";
export { useCreateCourse } from "./useCreateCourse";
export { useUpdateCourse } from "./useUpdateCourse";
export { useArchiveCourse } from "./useArchiveCourse";
export { useDeleteCourse } from "./useDeleteCourse";
export { useGenerateInviteCode } from "./useGenerateInviteCode";
export { useRemoveStudent } from "./useRemoveStudent";
