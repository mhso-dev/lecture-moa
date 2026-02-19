/**
 * Student Dashboard TanStack Query Hooks
 * REQ-FE-217: TanStack Query hooks for student dashboard data
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { STUDENT_DASHBOARD_ENDPOINTS } from "~/lib/api-endpoints";
import type {
  EnrolledCourse,
  QAActivityItem,
  QuizResult,
  StudyProgress,
  UpcomingQuiz,
  QANotification,
} from "@shared";

/**
 * Query key namespace for student dashboard
 */
export const studentDashboardKeys = {
  all: ["dashboard", "student"] as const,
  enrolledCourses: () => [...studentDashboardKeys.all, "enrolledCourses"] as const,
  recentQA: () => [...studentDashboardKeys.all, "recentQA"] as const,
  quizResults: () => [...studentDashboardKeys.all, "quizResults"] as const,
  studyProgress: () => [...studentDashboardKeys.all, "studyProgress"] as const,
  upcomingQuizzes: () => [...studentDashboardKeys.all, "upcomingQuizzes"] as const,
  notifications: () => [...studentDashboardKeys.all, "notifications"] as const,
};

/**
 * Stale time constants (in milliseconds)
 */
const STALE_TIME = {
  /** 2 minutes for metrics data */
  METRICS: 2 * 60 * 1000,
  /** 30 seconds for notifications (more real-time) */
  NOTIFICATIONS: 30 * 1000,
};

/**
 * Hook to fetch enrolled courses with progress
 * REQ-FE-211: Enrolled Courses Progress Widget data
 *
 * @returns TanStack Query result with EnrolledCourse[] data
 *
 * @example
 * ```tsx
 * const { data: courses, isLoading, error } = useEnrolledCourses();
 * ```
 */
export function useEnrolledCourses() {
  return useQuery<EnrolledCourse[]>({
    queryKey: studentDashboardKeys.enrolledCourses(),
    queryFn: async () => {
      const response = await api.get<EnrolledCourse[]>(
        STUDENT_DASHBOARD_ENDPOINTS.enrolledCourses
      );
      return response.data;
    },
    staleTime: STALE_TIME.METRICS,
  });
}

/**
 * Hook to fetch recent Q&A activity
 * REQ-FE-212: Recent Q&A Activity Widget data
 *
 * @returns TanStack Query result with QAActivityItem[] data
 *
 * @example
 * ```tsx
 * const { data: qaItems, isLoading } = useRecentQA();
 * ```
 */
export function useRecentQA() {
  return useQuery<QAActivityItem[]>({
    queryKey: studentDashboardKeys.recentQA(),
    queryFn: async () => {
      const response = await api.get<QAActivityItem[]>(
        STUDENT_DASHBOARD_ENDPOINTS.recentQA
      );
      return response.data;
    },
    staleTime: STALE_TIME.METRICS,
  });
}

/**
 * Hook to fetch recent quiz results
 * REQ-FE-213: Quiz Scores Summary Widget data
 *
 * @returns TanStack Query result with QuizResult[] data
 *
 * @example
 * ```tsx
 * const { data: results, isLoading } = useQuizResults();
 * ```
 */
export function useQuizResults() {
  return useQuery<QuizResult[]>({
    queryKey: studentDashboardKeys.quizResults(),
    queryFn: async () => {
      const response = await api.get<QuizResult[]>(
        STUDENT_DASHBOARD_ENDPOINTS.quizResults
      );
      return response.data;
    },
    staleTime: STALE_TIME.METRICS,
  });
}

/**
 * Hook to fetch study progress metrics
 * REQ-FE-214: Study Progress Widget data
 *
 * @returns TanStack Query result with StudyProgress data
 *
 * @example
 * ```tsx
 * const { data: progress, isLoading } = useStudyProgress();
 * // progress.currentStreak, progress.longestStreak, etc.
 * ```
 */
export function useStudyProgress() {
  return useQuery<StudyProgress>({
    queryKey: studentDashboardKeys.studyProgress(),
    queryFn: async () => {
      const response = await api.get<StudyProgress>(
        STUDENT_DASHBOARD_ENDPOINTS.studyProgress
      );
      return response.data;
    },
    staleTime: STALE_TIME.METRICS,
  });
}

/**
 * Hook to fetch upcoming/pending quizzes
 * REQ-FE-215: Upcoming Quizzes Widget data
 *
 * @returns TanStack Query result with UpcomingQuiz[] data
 *
 * @example
 * ```tsx
 * const { data: quizzes, isLoading } = useUpcomingQuizzes();
 * ```
 */
export function useUpcomingQuizzes() {
  return useQuery<UpcomingQuiz[]>({
    queryKey: studentDashboardKeys.upcomingQuizzes(),
    queryFn: async () => {
      const response = await api.get<UpcomingQuiz[]>(
        STUDENT_DASHBOARD_ENDPOINTS.upcomingQuizzes
      );
      return response.data;
    },
    staleTime: STALE_TIME.METRICS,
  });
}

/**
 * Hook to fetch Q&A notifications
 * REQ-FE-216: Q&A Notifications Widget data
 *
 * Uses shorter stale time (30 seconds) for more real-time updates.
 *
 * @returns TanStack Query result with QANotification[] data
 *
 * @example
 * ```tsx
 * const { data: notifications, isLoading } = useQANotifications();
 * const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;
 * ```
 */
export function useQANotifications() {
  return useQuery<QANotification[]>({
    queryKey: studentDashboardKeys.notifications(),
    queryFn: async () => {
      const response = await api.get<QANotification[]>(
        STUDENT_DASHBOARD_ENDPOINTS.notifications
      );
      return response.data;
    },
    staleTime: STALE_TIME.NOTIFICATIONS,
  });
}

// Re-export types for convenience
export type {
  EnrolledCourse,
  QAActivityItem,
  QuizResult,
  StudyProgress,
  UpcomingQuiz,
  QANotification,
};
