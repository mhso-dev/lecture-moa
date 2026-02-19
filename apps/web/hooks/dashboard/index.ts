/**
 * Dashboard Hooks Index
 * REQ-FE-217, REQ-FE-227: TanStack Query hooks for dashboard data
 */

// Student Dashboard Hooks (REQ-FE-217)
export {
  useEnrolledCourses,
  useRecentQA,
  useQuizResults,
  useStudyProgress,
  useUpcomingQuizzes,
  useQANotifications,
  studentDashboardKeys,
} from "./useStudentDashboard";

export type {
  EnrolledCourse,
  QAActivityItem,
  QuizResult,
  StudyProgress,
  UpcomingQuiz,
  QANotification,
} from "./useStudentDashboard";

export { useStudentRealtimeUpdates } from "./useStudentRealtimeUpdates";
export type { UseStudentRealtimeUpdatesReturn } from "./useStudentRealtimeUpdates";

// Instructor Dashboard Hooks (REQ-FE-227)
export {
  useInstructorCourses,
  useStudentActivity,
  usePendingQA,
  useQuizPerformance,
  useActivityFeed,
  instructorDashboardKeys,
} from "./useInstructorDashboard";

export type {
  InstructorCourse,
  StudentActivityStats,
  PendingQAItem,
  QuizPerformanceSummary,
  ActivityFeedItem,
} from "./useInstructorDashboard";

export { useInstructorRealtimeUpdates } from "./useInstructorRealtimeUpdates";
export type { UseInstructorRealtimeUpdatesReturn } from "./useInstructorRealtimeUpdates";

// Team Dashboard Hooks (REQ-FE-235)
export {
  useTeamOverview,
  useTeamMembers,
  useSharedMemos,
  useTeamActivity,
  teamDashboardKeys,
} from "./useTeamDashboard";

export type {
  TeamOverview,
  TeamMember,
  SharedMemo,
  TeamActivityItem,
  UseSharedMemosOptions,
  UseTeamActivityOptions,
} from "./useTeamDashboard";

export { useTeamRealtimeUpdates } from "./useTeamRealtimeUpdates";
export type { UseTeamRealtimeUpdatesReturn } from "./useTeamRealtimeUpdates";
