/**
 * API Endpoint Constants
 * REQ-FE-244: Dashboard API endpoint constants for data fetching
 */

/**
 * Student Dashboard API Endpoints
 * Used by useStudentDashboard hooks
 */
export const STUDENT_DASHBOARD_ENDPOINTS = {
  /** Enrolled courses with progress */
  enrolledCourses: "/api/v1/dashboard/student/courses",
  /** Recent Q&A activity */
  recentQA: "/api/v1/dashboard/student/qa",
  /** Quiz results */
  quizResults: "/api/v1/dashboard/student/quizzes/results",
  /** Study progress metrics */
  studyProgress: "/api/v1/dashboard/student/progress",
  /** Upcoming/pending quizzes */
  upcomingQuizzes: "/api/v1/dashboard/student/quizzes/upcoming",
  /** Q&A notifications */
  notifications: "/api/v1/dashboard/student/notifications",
} as const;

/**
 * Instructor Dashboard API Endpoints
 * Used by useInstructorDashboard hooks
 */
export const INSTRUCTOR_DASHBOARD_ENDPOINTS = {
  /** Instructor's courses with metrics */
  courses: "/api/v1/dashboard/instructor/courses",
  /** Student activity statistics */
  studentActivity: "/api/v1/dashboard/instructor/students/activity",
  /** Pending Q&A items */
  pendingQA: "/api/v1/dashboard/instructor/qa/pending",
  /** Quiz performance summaries */
  quizPerformance: "/api/v1/dashboard/instructor/quizzes/performance",
  /** Activity feed */
  activityFeed: "/api/v1/dashboard/instructor/activity",
} as const;

/**
 * Team Dashboard API Endpoints
 * Used by useTeamDashboard hooks
 */
export const TEAM_DASHBOARD_ENDPOINTS = {
  /** Team overview information */
  overview: "/api/v1/dashboard/team",
  /** Team members list */
  members: "/api/v1/dashboard/team/members",
  /** Shared memos */
  sharedMemos: "/api/v1/dashboard/team/memos",
  /** Team activity feed */
  activityFeed: "/api/v1/dashboard/team/activity",
} as const;

/**
 * Type exports for endpoint keys
 */
export type StudentDashboardEndpoint = keyof typeof STUDENT_DASHBOARD_ENDPOINTS;
export type InstructorDashboardEndpoint = keyof typeof INSTRUCTOR_DASHBOARD_ENDPOINTS;
export type TeamDashboardEndpoint = keyof typeof TEAM_DASHBOARD_ENDPOINTS;
