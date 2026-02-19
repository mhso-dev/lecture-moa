/**
 * Course Domain Type Definitions
 * REQ-FE-444: Type Safety for Course Domain
 */

/**
 * Course visibility options
 */
export type CourseVisibility = 'public' | 'invite_only';

/**
 * Course status options
 */
export type CourseStatus = 'draft' | 'published' | 'archived';

/**
 * Course category options
 */
export type CourseCategory =
  | 'programming'
  | 'design'
  | 'business'
  | 'science'
  | 'language'
  | 'other';

/**
 * Sort option for course list
 */
export type CourseSortOption = 'recent' | 'popular' | 'alphabetical';

/**
 * Minimal instructor info embedded in course
 */
export interface CourseInstructor {
  id: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Material summary embedded in course
 */
export interface CourseMaterialSummary {
  id: string;
  title: string;
  type: 'markdown' | 'video' | 'quiz';
  order: number;
}

/**
 * Syllabus section
 */
export interface CourseSyllabusSection {
  id: string;
  title: string;
  order: number;
  materials: CourseMaterialSummary[];
}

/**
 * Course list item (lightweight)
 */
export interface CourseListItem {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  status: CourseStatus;
  visibility: CourseVisibility;
  thumbnailUrl?: string;
  instructor: CourseInstructor;
  enrolledCount: number;
  materialCount: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Full course detail
 */
export interface Course extends CourseListItem {
  syllabus: CourseSyllabusSection[];
  inviteCode?: string; // Only included for course owner
}

/**
 * Enrollment record
 */
export interface CourseEnrollment {
  courseId: string;
  userId: string;
  enrolledAt: string;
  progressPercent: number; // 0-100
  completedMaterialIds: string[];
}

/**
 * Student progress (instructor view)
 */
export interface StudentProgress {
  userId: string;
  name: string;
  avatarUrl?: string;
  enrolledAt: string;
  progressPercent: number;
}

/**
 * Course list query params
 */
export interface CourseListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: CourseCategory;
  sort?: CourseSortOption;
  status?: CourseStatus;
}

/**
 * Paginated course list response
 */
export interface PaginatedCourseList {
  data: CourseListItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Course create payload
 */
export interface CreateCoursePayload {
  title: string;
  description: string;
  category: CourseCategory;
  thumbnailUrl?: string;
  visibility: CourseVisibility;
}

/**
 * Course update payload (partial)
 */
export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  category?: CourseCategory;
  thumbnailUrl?: string;
  visibility?: CourseVisibility;
  status?: CourseStatus;
}

/**
 * Invite code response
 */
export interface InviteCodeResponse {
  code: string;
  expiresAt?: string;
}

/**
 * Enroll via invite code payload
 */
export interface EnrollWithCodePayload {
  code: string;
}
