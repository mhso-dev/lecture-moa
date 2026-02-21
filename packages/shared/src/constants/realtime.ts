// Q&A Realtime channels
export const QA_CHANNELS = {
  // Individual question detail channel: receive new answers, status changes in real-time
  questionDetail: (questionId: string) =>
    `qa:question:${questionId}` as const,
} as const;

// Realtime postgres_changes event filters
export const QA_REALTIME_FILTERS = {
  // Detect new answers for a specific question
  newAnswer: (questionId: string) => ({
    event: 'INSERT' as const,
    schema: 'public',
    table: 'answers',
    filter: `question_id=eq.${questionId}`,
  }),
  // Detect question status/upvote changes
  questionUpdate: (questionId: string) => ({
    event: 'UPDATE' as const,
    schema: 'public',
    table: 'questions',
    filter: `id=eq.${questionId}`,
  }),
  // Detect answer updates (acceptance, etc.) for a specific question
  answerUpdate: (questionId: string) => ({
    event: 'UPDATE' as const,
    schema: 'public',
    table: 'answers',
    filter: `question_id=eq.${questionId}`,
  }),
} as const;

/**
 * Supabase Realtime Constants
 * REQ-BE-006-030: Realtime channel and event configuration for memo subscriptions
 */

/**
 * Realtime channel name patterns for Supabase postgres_changes
 */
export const REALTIME_CHANNELS = {
  /** Channel for team memo changes: `team-memos:{teamId}` */
  TEAM_MEMOS: (teamId: string) => `team-memos:${teamId}` as const,
  /** Channel for personal memo changes: `personal-memos:{userId}` */
  PERSONAL_MEMOS: (userId: string) => `personal-memos:${userId}` as const,
} as const;

/**
 * Realtime event types matching Supabase postgres_changes events
 */
export const REALTIME_EVENTS = {
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/**
 * Realtime subscription configuration defaults
 */
export const REALTIME_CONFIG = {
  /** Schema to listen on */
  SCHEMA: "public",
  /** Table to listen for changes */
  TABLE: "memos",
  /** Reconnect interval in milliseconds */
  RECONNECT_INTERVAL_MS: 3000,
  /** Maximum reconnect attempts */
  MAX_RECONNECT_ATTEMPTS: 5,
} as const;
