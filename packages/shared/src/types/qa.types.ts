/**
 * Q&A Type Definitions
 * REQ-FE-500: Shared Q&A types for frontend and backend
 */

import type { UserRole } from './auth.types';

/**
 * Question status enum
 */
export type QAStatus = 'OPEN' | 'RESOLVED' | 'CLOSED';

/**
 * Context captured from material viewer text selection
 */
export interface QAQuestionContext {
  materialId: string;
  headingId: string | null;     // IMPORTANT: use headingId, not sectionAnchor
  selectedText: string;          // max 500 chars
}

/**
 * Author info embedded in questions and answers
 */
export interface QAAuthorInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
}

/**
 * Full question (detail view)
 */
export interface QAQuestion {
  id: string;
  courseId: string;
  courseName: string;
  materialId: string;
  materialTitle: string;
  authorId: string;
  author: QAAuthorInfo;
  title: string;
  content: string;              // Markdown
  context: QAQuestionContext;
  status: QAStatus;
  upvoteCount: number;
  isUpvoted: boolean;
  answerCount: number;
  aiSuggestion: QAAnswer | null;
  aiSuggestionPending: boolean;
  createdAt: string;            // ISO 8601
  updatedAt: string;
}

/**
 * List item (abbreviated for list rendering)
 */
export interface QAListItem {
  id: string;
  courseId: string;
  courseName: string;
  materialId: string;
  materialTitle: string;
  author: QAAuthorInfo;
  title: string;
  context: Pick<QAQuestionContext, 'selectedText'>;
  status: QAStatus;
  upvoteCount: number;
  answerCount: number;
  hasAiSuggestion: boolean;
  createdAt: string;
}

/**
 * Answer (human or AI-generated)
 */
export interface QAAnswer {
  id: string;
  questionId: string;
  authorId: string;
  author: QAAuthorInfo;
  content: string;              // Markdown
  isAccepted: boolean;
  isAiGenerated: boolean;
  upvoteCount: number;
  isUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload for creating a question
 */
export interface QACreateRequest {
  courseId: string;
  materialId: string;
  title: string;
  content: string;
  context: QAQuestionContext;
}

/**
 * Request payload for creating an answer
 */
export interface QAAnswerRequest {
  content: string;
}

/**
 * List filter params
 */
export interface QAListFilter {
  courseId?: string;
  materialId?: string;
  status?: QAStatus | 'ALL';
  q?: string;
  sort?: 'newest' | 'upvotes' | 'answers' | 'unanswered';
  page: number;
  limit: number;
}

/**
 * Lightweight highlight data for rendering Q&A highlights on material content
 * REQ-FE-009: Q&A Highlight Rendering
 */
export interface QAHighlightData {
  id: string;
  selectedText: string;
  headingId: string | null;
  status: QAStatus;
  title: string;
}

/**
 * WebSocket notification payload for real-time Q&A updates
 * Note: Named QAWebSocketNotification to avoid conflict with dashboard.types QANotification
 */
export interface QAWebSocketNotification {
  id: string;
  type: 'NEW_ANSWER' | 'AI_SUGGESTION_READY' | 'QUESTION_RESOLVED';
  questionId: string;
  questionTitle: string;
  actorName?: string;
  receivedAt: string;
}
