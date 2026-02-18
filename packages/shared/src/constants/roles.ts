/**
 * Role Constants
 * REQ-FE-054: User role definitions
 */

import type { UserRole } from "../types";

/**
 * User role values
 */
export const ROLES = {
  STUDENT: "student",
  INSTRUCTOR: "instructor",
  ADMIN: "admin",
} as const satisfies Record<string, UserRole>;

/**
 * Role display names (for UI)
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  instructor: "Instructor",
  admin: "Administrator",
} as const;

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  student: "Can view courses, materials, and quizzes. Can ask questions and submit answers.",
  instructor: "Can create and manage courses, materials, quizzes. Can answer student questions.",
  admin: "Full access to all features. Can manage users and system settings.",
} as const;
