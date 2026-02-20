/**
 * Dashboard Type Definitions
 * REQ-FE-218, REQ-FE-228, REQ-FE-236: Dashboard data types for Student, Instructor, and Team views
 */

// ============================================================================
// Student Dashboard Types (REQ-FE-218)
// ============================================================================

/**
 * Student's enrolled course with progress information
 */
export interface EnrolledCourse {
  id: string;
  title: string;
  instructorName: string;
  progressPercent: number;
  lastAccessedAt: Date;
}

/**
 * Q&A activity item for student's recent interactions
 */
export interface QAActivityItem {
  id: string;
  questionExcerpt: string;
  courseName: string;
  status: "answered" | "pending";
  createdAt: Date;
}

/**
 * Quiz result for student's recent quiz performance
 */
export interface QuizResult {
  id: string;
  quizTitle: string;
  courseName: string;
  score: number;
  totalPoints: number;
  takenAt: Date;
}

/**
 * Study progress metrics for student
 */
export interface StudyProgress {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  materialsRead: number;
}

/**
 * Upcoming/pending quiz for student
 */
export interface UpcomingQuiz {
  id: string;
  quizTitle: string;
  courseName: string;
  questionCount: number;
  dueAt?: Date;
}

/**
 * Q&A notification for student
 */
export interface QANotification {
  id: string;
  message: string;
  questionExcerpt: string;
  courseName: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Aggregated student dashboard data
 */
export interface StudentDashboardData {
  enrolledCourses: EnrolledCourse[];
  recentQA: QAActivityItem[];
  quizResults: QuizResult[];
  studyProgress: StudyProgress;
  upcomingQuizzes: UpcomingQuiz[];
  notifications: QANotification[];
}

// ============================================================================
// Instructor Dashboard Types (REQ-FE-228)
// ============================================================================

/**
 * Instructor's course with metrics
 */
export interface InstructorCourse {
  id: string;
  title: string;
  enrolledCount: number;
  materialsCount: number;
  pendingQACount: number;
  isPublished: boolean;
}

/**
 * Student activity statistics for instructor's courses
 */
export interface StudentActivityStats {
  totalStudents: number;
  activeStudents7d: number;
  avgCompletionRate: number;
  studySessions7d: number;
}

/**
 * Pending Q&A item awaiting instructor response
 */
export interface PendingQAItem {
  id: string;
  questionExcerpt: string;
  studentName: string;
  courseName: string;
  askedAt: Date;
  isUrgent: boolean;
}

/**
 * Quiz performance summary for instructor
 */
export interface QuizPerformanceSummary {
  id: string;
  quizTitle: string;
  courseName: string;
  averageScore: number;
  submissionCount: number;
  passRate: number;
}

/**
 * Activity feed item type for instructor dashboard
 */
export type ActivityFeedItemType = "enrolled" | "studied" | "asked" | "quiz_completed";

/**
 * Activity feed item for instructor dashboard
 */
export interface ActivityFeedItem {
  id: string;
  type: ActivityFeedItemType;
  actorName: string;
  courseName: string;
  createdAt: Date;
}

/**
 * Aggregated instructor dashboard data
 */
export interface InstructorDashboardData {
  courses: InstructorCourse[];
  studentActivity: StudentActivityStats;
  pendingQA: PendingQAItem[];
  quizPerformance: QuizPerformanceSummary[];
  activityFeed: ActivityFeedItem[];
}

// ============================================================================
// Team Dashboard Types (REQ-FE-236)
// ============================================================================

/**
 * Team member role
 */
export type TeamMemberRole = "leader" | "member";

/**
 * Team overview information
 */
export interface TeamOverview {
  id: string;
  name: string;
  courseName: string;
  memberCount: number;
  description?: string;
  createdAt: Date;
}

/**
 * Team member with activity status
 */
export interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string;
  role: TeamMemberRole;
  lastActiveAt: Date;
}

/**
 * Shared memo in team
 */
export interface SharedMemo {
  id: string;
  title: string;
  authorName: string;
  excerpt: string;
  updatedAt: Date;
}

/**
 * Team activity item type
 */
export type TeamActivityItemType = "memo_created" | "memo_updated" | "member_joined" | "member_left" | "qa_asked";

/**
 * Team activity item
 */
export interface TeamActivityItem {
  id: string;
  type: TeamActivityItemType;
  actorName: string;
  description: string;
  createdAt: Date;
}

/**
 * Aggregated team dashboard data
 */
export interface TeamDashboardData {
  overview: TeamOverview;
  members: TeamMember[];
  sharedMemos: SharedMemo[];
  activityFeed: TeamActivityItem[];
}
