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
  QA_AI_SUGGESTION_READY: "qa:ai_suggestion_ready",
  QA_QUESTION_RESOLVED: "qa:question_resolved",

  // Notification events
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",

  // Presence events
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  USER_TYPING: "user:typing",

  // Team Memo events (REQ-FE-704)
  TEAM_MEMO_CREATED: "team_memo:created",
  TEAM_MEMO_UPDATED: "team_memo:updated",
  TEAM_MEMO_DELETED: "team_memo:deleted",

  // Team Member events (REQ-FE-704)
  TEAM_MEMBER_JOINED: "team:member_joined",
  TEAM_MEMBER_LEFT: "team:member_left",
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
  // Team and Memo categories (REQ-FE-704)
  TEAM: "team",
  MEMO: "memo",
} as const;
