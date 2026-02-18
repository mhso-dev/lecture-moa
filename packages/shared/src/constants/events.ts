/**
 * Event Constants
 * REQ-FE-054: WebSocket and application event names
 */

/**
 * WebSocket event names
 */
export const EVENTS = {
  // Authentication events
  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
  AUTH_SESSION_EXPIRED: "auth:session_expired",

  // Course events
  COURSE_CREATED: "course:created",
  COURSE_UPDATED: "course:updated",
  COURSE_DELETED: "course:deleted",

  // Material events
  MATERIAL_CREATED: "material:created",
  MATERIAL_UPDATED: "material:updated",
  MATERIAL_DELETED: "material:deleted",

  // Quiz events
  QUIZ_STARTED: "quiz:started",
  QUIZ_SUBMITTED: "quiz:submitted",
  QUIZ_GRADED: "quiz:graded",

  // Q&A events
  QA_QUESTION_POSTED: "qa:question_posted",
  QA_ANSWER_POSTED: "qa:answer_posted",

  // Notification events
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",

  // Presence events
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  USER_TYPING: "user:typing",
} as const;

/**
 * Event categories for organization
 */
export const EVENT_CATEGORIES = {
  AUTH: "auth",
  COURSE: "course",
  MATERIAL: "material",
  QUIZ: "quiz",
  QA: "qa",
  NOTIFICATION: "notification",
  PRESENCE: "presence",
} as const;
