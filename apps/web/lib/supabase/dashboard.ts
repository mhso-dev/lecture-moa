/**
 * Supabase Query Layer for Dashboard
 *
 * Provides direct Supabase database access for all dashboard-related operations.
 * Bridges PostgreSQL views/functions with frontend hooks.
 * Uses browser client for all client-side operations (RLS enforced by Supabase).
 */

import { createClient } from "./client";
import type { Database } from "~/types/supabase";
import type {
  EnrolledCourse,
  QAActivityItem,
  QuizResult,
  StudyProgress,
  UpcomingQuiz,
  QANotification,
  InstructorCourse,
  StudentActivityStats,
  PendingQAItem,
  QuizPerformanceSummary,
  ActivityFeedItem,
  ActivityFeedItemType,
  TeamOverview,
  TeamMember,
  TeamMemberRole,
  SharedMemo,
  TeamActivityItem,
  TeamActivityItemType,
} from "@shared";

// ---------------------------------------------------------------------------
// View Row Type Aliases
// ---------------------------------------------------------------------------

type StudentEnrolledCoursesRow =
  Database["public"]["Views"]["v_student_enrolled_courses"]["Row"];
type StudentQAActivityRow =
  Database["public"]["Views"]["v_student_qa_activity"]["Row"];
type StudentQuizResultsRow =
  Database["public"]["Views"]["v_student_quiz_results"]["Row"];
type StudentUpcomingQuizzesRow =
  Database["public"]["Views"]["v_student_upcoming_quizzes"]["Row"];
type InstructorCoursesOverviewRow =
  Database["public"]["Views"]["v_instructor_courses_overview"]["Row"];
type InstructorPendingQARow =
  Database["public"]["Views"]["v_instructor_pending_qa"]["Row"];
type InstructorQuizPerformanceRow =
  Database["public"]["Views"]["v_instructor_quiz_performance"]["Row"];
type TeamOverviewRow =
  Database["public"]["Views"]["v_team_overview"]["Row"];
type TeamMembersDetailRow =
  Database["public"]["Views"]["v_team_members_detail"]["Row"];
type TeamSharedMemosRow =
  Database["public"]["Views"]["v_team_shared_memos"]["Row"];
type NotificationRow =
  Database["public"]["Tables"]["notifications"]["Row"];

// ---------------------------------------------------------------------------
// Paginated Response Type
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
}

// ============================================================================
// Student Functions
// ============================================================================

export async function fetchEnrolledCourses(): Promise<EnrolledCourse[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_student_enrolled_courses")
    .select("*")
    .limit(20);

  if (error) {
    throw new Error(`Failed to fetch enrolled courses: ${error.message}`);
  }

  return data.map((row: StudentEnrolledCoursesRow) => ({
    id: row.course_id ?? "",
    title: row.title ?? "",
    instructorName: row.instructor_name ?? "",
    progressPercent: row.progress_percent ?? 0,
    lastAccessedAt: new Date(row.last_accessed_at ?? new Date()),
  }));
}

export async function fetchRecentQA(): Promise<QAActivityItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_student_qa_activity")
    .select("*")
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch recent Q&A: ${error.message}`);
  }

  return data.map((row: StudentQAActivityRow) => ({
    id: row.question_id ?? "",
    questionExcerpt: row.question_excerpt ?? "",
    courseName: row.course_name ?? "",
    status: (row.status ?? "pending") as "answered" | "pending",
    createdAt: new Date(row.created_at ?? new Date()),
  }));
}

export async function fetchQuizResults(): Promise<QuizResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_student_quiz_results")
    .select("*")
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch quiz results: ${error.message}`);
  }

  return data.map((row: StudentQuizResultsRow) => ({
    id: row.attempt_id ?? "",
    quizTitle: row.quiz_title ?? "",
    courseName: row.course_name ?? "",
    score: row.score ?? 0,
    totalPoints: row.total_points ?? 0,
    takenAt: new Date(row.taken_at ?? new Date()),
  }));
}

export async function fetchStudyProgress(): Promise<StudyProgress> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required to fetch study progress");
  }

  const { data, error } = await supabase.rpc("get_student_study_progress", {
    p_user_id: user.id,
  });

  if (error) {
    throw new Error(`Failed to fetch study progress: ${error.message}`);
  }

  const progress = data as Record<string, number> | null;

  return {
    currentStreak: progress?.currentStreak ?? 0,
    longestStreak: progress?.longestStreak ?? 0,
    totalSessions: progress?.totalSessions ?? 0,
    materialsRead: progress?.materialsRead ?? 0,
  };
}

export async function fetchUpcomingQuizzes(): Promise<UpcomingQuiz[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_student_upcoming_quizzes")
    .select("*");

  if (error) {
    throw new Error(`Failed to fetch upcoming quizzes: ${error.message}`);
  }

  return data.map((row: StudentUpcomingQuizzesRow) => ({
    id: row.quiz_id ?? "",
    quizTitle: row.quiz_title ?? "",
    courseName: row.course_name ?? "",
    questionCount: row.question_count ?? 0,
    dueAt: row.due_date ? new Date(row.due_date) : undefined,
  }));
}

export async function fetchQANotifications(): Promise<QANotification[]> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required to fetch notifications");
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return data.map((row: NotificationRow) => {
    const notifData = (row.data ?? {}) as Record<string, string>;

    return {
      id: row.id,
      message: row.message ?? row.title,
      questionExcerpt: notifData.question_excerpt ?? "",
      courseName: notifData.course_name ?? "",
      isRead: row.is_read,
      createdAt: new Date(row.created_at),
    };
  });
}

// ============================================================================
// Instructor Functions
// ============================================================================

export async function fetchInstructorCourses(): Promise<InstructorCourse[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_instructor_courses_overview")
    .select("*");

  if (error) {
    throw new Error(`Failed to fetch instructor courses: ${error.message}`);
  }

  return data.map((row: InstructorCoursesOverviewRow) => ({
    id: row.course_id ?? "",
    title: row.title ?? "",
    enrolledCount: row.enrolled_count ?? 0,
    materialsCount: row.materials_count ?? 0,
    pendingQACount: row.pending_qa_count ?? 0,
    isPublished: row.is_published ?? false,
  }));
}

export async function fetchStudentActivityStats(): Promise<StudentActivityStats> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "Authentication required to fetch student activity stats",
    );
  }

  const { data, error } = await supabase.rpc("get_student_activity_stats", {
    p_instructor_id: user.id,
  });

  if (error) {
    throw new Error(
      `Failed to fetch student activity stats: ${error.message}`,
    );
  }

  const stats = data as Record<string, number> | null;

  return {
    totalStudents: stats?.totalStudents ?? 0,
    activeStudents7d: stats?.activeStudents7d ?? 0,
    avgCompletionRate: stats?.avgCompletionRate ?? 0,
    studySessions7d: stats?.studySessions7d ?? 0,
  };
}

export async function fetchPendingQA(): Promise<PendingQAItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_instructor_pending_qa")
    .select("*");

  if (error) {
    throw new Error(`Failed to fetch pending Q&A: ${error.message}`);
  }

  return data.map((row: InstructorPendingQARow) => ({
    id: row.question_id ?? "",
    questionExcerpt: row.question_excerpt ?? "",
    studentName: row.student_name ?? "",
    courseName: row.course_name ?? "",
    askedAt: new Date(row.asked_at ?? new Date()),
    isUrgent: row.is_urgent ?? false,
  }));
}

export async function fetchQuizPerformance(): Promise<
  QuizPerformanceSummary[]
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_instructor_quiz_performance")
    .select("*");

  if (error) {
    throw new Error(`Failed to fetch quiz performance: ${error.message}`);
  }

  return data.map((row: InstructorQuizPerformanceRow) => ({
    id: row.quiz_id ?? "",
    quizTitle: row.quiz_title ?? "",
    courseName: row.course_name ?? "",
    averageScore: row.average_score ?? 0,
    submissionCount: row.submission_count ?? 0,
    passRate: row.pass_rate ?? 0,
  }));
}

export async function fetchActivityFeed(
  page: number,
  limit: number,
): Promise<PaginatedResponse<ActivityFeedItem>> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required to fetch activity feed");
  }

  const { data, error } = await supabase.rpc("get_instructor_activity_feed", {
    p_instructor_id: user.id,
    p_limit: limit,
    p_offset: (page - 1) * limit,
  });

  if (error) {
    throw new Error(`Failed to fetch activity feed: ${error.message}`);
  }

  const items = data.map(
    (row: { id: string; type: string; actor_name: string; course_name: string; created_at: string }) => ({
      id: row.id,
      type: row.type as ActivityFeedItemType,
      actorName: row.actor_name,
      courseName: row.course_name,
      createdAt: new Date(row.created_at),
    }),
  );

  return {
    items,
    hasMore: items.length === limit,
  };
}

// ============================================================================
// Team Functions
// ============================================================================

export async function fetchTeamOverview(teamId: string): Promise<TeamOverview> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_team_overview")
    .select("*")
    .eq("team_id", teamId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch team overview: ${error.message}`);
  }

  const row = data as TeamOverviewRow;

  return {
    id: row.team_id ?? "",
    name: row.team_name ?? "",
    courseName: row.course_name ?? "",
    memberCount: row.member_count ?? 0,
    description: row.description ?? undefined,
    createdAt: new Date(row.created_at ?? new Date()),
  };
}

export async function fetchTeamMembers(
  teamId: string,
): Promise<TeamMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_team_members_detail")
    .select("*")
    .eq("team_id", teamId);

  if (error) {
    throw new Error(`Failed to fetch team members: ${error.message}`);
  }

  return data.map((row: TeamMembersDetailRow) => ({
    id: row.member_id ?? "",
    name: row.display_name ?? "",
    avatarUrl: row.avatar_url ?? undefined,
    role: (row.role ?? "member") as TeamMemberRole,
    lastActiveAt: new Date(row.last_active_at ?? new Date()),
  }));
}

export async function fetchSharedMemos(
  teamId: string,
  page: number,
  limit: number,
): Promise<PaginatedResponse<SharedMemo>> {
  const supabase = createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("v_team_shared_memos")
    .select("*")
    .eq("team_id", teamId)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch shared memos: ${error.message}`);
  }

  const items = data.map((row: TeamSharedMemosRow) => ({
    id: row.memo_id ?? "",
    title: row.title ?? "",
    authorName: row.author_name ?? "",
    excerpt: row.excerpt ?? "",
    updatedAt: new Date(row.updated_at ?? new Date()),
  }));

  return {
    items,
    hasMore: items.length === limit,
  };
}

export async function fetchTeamActivityFeed(
  teamId: string,
  page: number,
  limit: number,
): Promise<PaginatedResponse<TeamActivityItem>> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_team_activity_feed", {
    p_team_id: teamId,
    p_limit: limit,
    p_offset: (page - 1) * limit,
  });

  if (error) {
    throw new Error(`Failed to fetch team activity feed: ${error.message}`);
  }

  const items = data.map(
    (row: { id: string; type: string; actor_name: string; description: string; created_at: string }) => ({
      id: row.id,
      type: row.type as TeamActivityItemType,
      actorName: row.actor_name,
      description: row.description,
      createdAt: new Date(row.created_at),
    }),
  );

  return {
    items,
    hasMore: items.length === limit,
  };
}
