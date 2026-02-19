/**
 * Q&A Hooks Index
 * REQ-FE-503: TanStack Query hooks for Q&A API interactions
 *
 * Export all Q&A hooks for use across the application.
 */

// Query Key Factory
export { qaKeys } from './qa-keys';

// Query Hooks
export { useQAList, type UseQAListParams, type QAListResponse } from './useQAList';
export { useQADetail } from './useQADetail';

// Mutation Hooks
export { useCreateQuestion } from './useCreateQuestion';
export { useUpdateQuestion } from './useUpdateQuestion';
export { useCreateAnswer } from './useCreateAnswer';
export { useAcceptAnswer } from './useAcceptAnswer';
export { useUpvoteQuestion } from './useUpvoteQuestion';
export { useUpvoteAnswer } from './useUpvoteAnswer';
export { useChangeQuestionStatus } from './useChangeQuestionStatus';
export { useRequestAISuggestion } from './useRequestAISuggestion';

// WebSocket Hook
export {
  useQAWebSocket,
  type UseQAWebSocketOptions,
  type UseQAWebSocketReturn,
} from './useQAWebSocket';
