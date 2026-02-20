/**
 * Custom Hooks Index
 * REQ-FE-025: Custom hooks for responsive behavior and scroll tracking
 * REQ-FE-002: Authentication hooks
 * REQ-FE-362: Material domain hooks
 * REQ-FE-005: Course query hooks
 * REQ-FE-414-FE-437: Course mutation hooks
 * REQ-FE-503: Q&A query and mutation hooks
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

// Q&A hooks (re-exported from qa subdirectory)
export {
  // Query keys
  qaKeys,
  // Query hooks
  useQAList,
  useQADetail,
  // Mutation hooks
  useCreateQuestion,
  useCreateAnswer,
  useAcceptAnswer,
  useUpvoteQuestion,
  useUpvoteAnswer,
  useChangeQuestionStatus,
  useRequestAISuggestion,
  // WebSocket hook
  useQAWebSocket,
} from "./qa";

// Team hooks (re-exported from team subdirectory)
export {
  // Query keys
  teamKeys,
  // Team list queries
  useMyTeams,
  useAvailableTeams,
  // Team detail queries
  useTeamDetail,
  useTeamMembers,
  useTeamActivity,
  // Team CRUD mutations
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  // Team membership mutations
  useTeamMembership,
} from "./team";

// Memo hooks (re-exported from memo subdirectory)
export {
  // Query keys
  memoKeys,
  // Memo list queries
  usePersonalMemos,
  useTeamMemos,
  // Memo detail queries and mutations
  useMemoDetail,
  useCreateMemo,
  useUpdateMemo,
  useDeleteMemo,
} from "./memo";
