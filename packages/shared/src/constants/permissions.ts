/**
 * Permission Constants
 * REQ-FE-054: Permission definitions and role mappings
 */

import type { RolePermissions } from "../types";

/**
 * Permission values
 */
export const PERMISSIONS = {
  // Course permissions
  VIEW_COURSES: "view:courses",
  CREATE_COURSE: "create:course",
  EDIT_COURSE: "edit:course",
  DELETE_COURSE: "delete:course",

  // Material permissions
  VIEW_MATERIALS: "view:materials",
  CREATE_MATERIAL: "create:material",
  EDIT_MATERIAL: "edit:material",
  DELETE_MATERIAL: "delete:material",

  // Quiz permissions
  VIEW_QUIZZES: "view:quizzes",
  CREATE_QUIZ: "create:quiz",
  EDIT_QUIZ: "edit:quiz",
  DELETE_QUIZ: "delete:quiz",

  // Q&A permissions
  VIEW_QA: "view:qa",
  CREATE_QA: "create:qa",

  // User management permissions
  MANAGE_USERS: "manage:users",
  MANAGE_TEAMS: "manage:teams",
} as const;

/**
 * Role to permission mapping
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  student: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_MATERIALS,
    PERMISSIONS.VIEW_QUIZZES,
    PERMISSIONS.VIEW_QA,
    PERMISSIONS.CREATE_QA,
  ],
  instructor: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSE,
    PERMISSIONS.EDIT_COURSE,
    PERMISSIONS.DELETE_COURSE,
    PERMISSIONS.VIEW_MATERIALS,
    PERMISSIONS.CREATE_MATERIAL,
    PERMISSIONS.EDIT_MATERIAL,
    PERMISSIONS.DELETE_MATERIAL,
    PERMISSIONS.VIEW_QUIZZES,
    PERMISSIONS.CREATE_QUIZ,
    PERMISSIONS.EDIT_QUIZ,
    PERMISSIONS.DELETE_QUIZ,
    PERMISSIONS.VIEW_QA,
    PERMISSIONS.CREATE_QA,
    PERMISSIONS.MANAGE_TEAMS,
  ],
  admin: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.CREATE_COURSE,
    PERMISSIONS.EDIT_COURSE,
    PERMISSIONS.DELETE_COURSE,
    PERMISSIONS.VIEW_MATERIALS,
    PERMISSIONS.CREATE_MATERIAL,
    PERMISSIONS.EDIT_MATERIAL,
    PERMISSIONS.DELETE_MATERIAL,
    PERMISSIONS.VIEW_QUIZZES,
    PERMISSIONS.CREATE_QUIZ,
    PERMISSIONS.EDIT_QUIZ,
    PERMISSIONS.DELETE_QUIZ,
    PERMISSIONS.VIEW_QA,
    PERMISSIONS.CREATE_QA,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_TEAMS,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: keyof typeof ROLE_PERMISSIONS,
  permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
