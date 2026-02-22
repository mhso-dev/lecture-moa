/**
 * Instructor Dashboard TanStack Query Hooks
 * REQ-FE-227: TanStack Query hooks for instructor dashboard data
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchInstructorCourses,
  fetchStudentActivityStats,
  fetchPendingQA,
  fetchQuizPerformance,
  fetchActivityFeed,
} from "~/lib/supabase/dashboard";
import type { PaginatedResponse } from "~/lib/supabase/dashboard";
import type {
  InstructorCourse,
  StudentActivityStats,
  PendingQAItem,
  QuizPerformanceSummary,
  ActivityFeedItem,
} from "@shared";

/**
 * Query key namespace for instructor dashboard
 */
export const instructorDashboardKeys = {
  all: ["dashboard", "instructor"] as const,
  courses: () => [...instructorDashboardKeys.all, "courses"] as const,
  studentActivity: () => [...instructorDashboardKeys.all, "studentActivity"] as const,
  pendingQA: () => [...instructorDashboardKeys.all, "pendingQA"] as const,
  quizPerformance: () => [...instructorDashboardKeys.all, "quizPerformance"] as const,
  activityFeed: (page: number) => [...instructorDashboardKeys.all, "activityFeed", page] as const,
};

/**
 * Stale time constants (in milliseconds)
 */
const STALE_TIME = {
  /** 2 minutes for metrics data */
  METRICS: 2 * 60 * 1000,
  /** 1 minute for pending Q&A (more real-time) */
  PENDING_QA: 1 * 60 * 1000,
};

/**
 * Hook to fetch instructor's courses with metrics
 * REQ-FE-221: My Courses Overview Widget data
 *
 * @returns TanStack Query result with InstructorCourse[] data
 *
 * @example
 * ```tsx
 * const { data: courses, isLoading, error } = useInstructorCourses();
 * ```
 */
export function useInstructorCourses() {
  return useQuery<InstructorCourse[]>({
    queryKey: instructorDashboardKeys.courses(),
    queryFn: () => fetchInstructorCourses(),
    staleTime: STALE_TIME.METRICS,
  });
}

/**
 * Hook to fetch aggregated student activity statistics
 * REQ-FE-222: Student Enrollment & Activity Widget data
 *
 * @returns TanStack Query result with StudentActivityStats data
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useStudentActivity();
 * // stats.totalStudents, stats.activeStudents7d, etc.
 * ```
 */
export function useStudentActivity() {
  return useQuery<StudentActivityStats>({
    queryKey: instructorDashboardKeys.studentActivity(),
    queryFn: () => fetchStudentActivityStats(),
    staleTime: STALE_TIME.METRICS,
  });
}

/**
 * Hook to fetch pending Q&A items awaiting instructor response
 * REQ-FE-223: Pending Q&A Widget data
 *
 * Uses shorter stale time (1 minute) for more real-time updates.
 *
 * @returns TanStack Query result with PendingQAItem[] data
 *
 * @example
 * ```tsx
 * const { data: pendingQuestions, isLoading } = usePendingQA();
 * // pendingQuestions ordered oldest first
 * ```
 */
export function usePendingQA() {
  return useQuery<PendingQAItem[]>({
    queryKey: instructorDashboardKeys.pendingQA(),
    queryFn: () => fetchPendingQA(),
    staleTime: STALE_TIME.PENDING_QA,
  });
}

/**
 * Hook to fetch quiz performance summaries
 * REQ-FE-224: Quiz Performance Summary Widget data
 *
 * @returns TanStack Query result with QuizPerformanceSummary[] data
 *
 * @example
 * ```tsx
 * const { data: quizzes, isLoading } = useQuizPerformance();
 * // quizzes[].averageScore, quizzes[].submissionCount, etc.
 * ```
 */
export function useQuizPerformance() {
  return useQuery<QuizPerformanceSummary[]>({
    queryKey: instructorDashboardKeys.quizPerformance(),
    queryFn: () => fetchQuizPerformance(),
    staleTime: STALE_TIME.METRICS,
  });
}

/**
 * Hook to fetch paginated activity feed
 * REQ-FE-225: Recent Student Activity Feed Widget data
 *
 * @param options - Pagination options
 * @param options.page - Page number (default: 1)
 * @returns TanStack Query result with paginated ActivityFeedItem data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useActivityFeed({ page: 1 });
 * // data.items - array of activity items
 * // data.pagination - pagination metadata
 * ```
 */
export function useActivityFeed({ page = 1 }: { page?: number } = {}) {
  return useQuery<PaginatedResponse<ActivityFeedItem>>({
    queryKey: instructorDashboardKeys.activityFeed(page),
    queryFn: () => fetchActivityFeed(page, 10),
    staleTime: STALE_TIME.METRICS,
  });
}

// Re-export types for convenience
export type {
  InstructorCourse,
  StudentActivityStats,
  PendingQAItem,
  QuizPerformanceSummary,
  ActivityFeedItem,
};
