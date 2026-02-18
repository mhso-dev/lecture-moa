/**
 * Authentication Type Definitions
 * REQ-FE-051: Shared auth types for frontend and backend
 */

/**
 * User role enum
 */
export type UserRole = "student" | "instructor" | "admin";

/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  image?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Session information
 */
export interface Session {
  user: User;
  accessToken: string;
  expiresAt: Date;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: User;
  session: Session;
}

/**
 * Role-based permission type
 */
export type Permission =
  | "view:courses"
  | "create:course"
  | "edit:course"
  | "delete:course"
  | "view:materials"
  | "create:material"
  | "edit:material"
  | "delete:material"
  | "view:quizzes"
  | "create:quiz"
  | "edit:quiz"
  | "delete:quiz"
  | "view:qa"
  | "create:qa"
  | "manage:users"
  | "manage:teams";

/**
 * Role permission mapping
 */
export type RolePermissions = Record<UserRole, Permission[]>;

/**
 * Reset password request payload
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * Reset password confirm payload
 */
export interface ResetPasswordConfirmRequest {
  token: string;
  password: string;
}

/**
 * Update profile request payload
 */
export interface UpdateProfileRequest {
  name?: string;
  image?: string;
}

/**
 * Change password request payload
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
