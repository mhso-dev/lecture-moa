/**
 * useQAWebSocket Hook - Supabase Realtime Subscription for Q&A Events
 * TASK-014: WebSocket subscription hook for Q&A events
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-545: WebSocket connection for Q&A
 * REQ-BE-004-025: Subscribe to new answers, question updates, and answer updates
 *
 * Subscribes to Q&A Supabase Realtime events and manages real-time cache invalidation.
 * Uses subscribeToQuestion/unsubscribeFromChannel from ~/lib/supabase/realtime.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQAStore } from '~/stores/qa.store';
import type { QAStore } from '~/stores/qa.store';
import { qaKeys } from './qa-keys';
import {
  subscribeToQuestion,
  unsubscribeFromChannel,
} from '~/lib/supabase/realtime';

/**
 * Options for useQAWebSocket hook
 */
export interface UseQAWebSocketOptions {
  /** The question ID to subscribe to. When provided, subscribes to Realtime events for this question. */
  questionId?: string;
  /** Callback when new answer is posted */
  onNewAnswer?: (payload: {
    questionId: string;
    answerId: string;
    questionTitle?: string;
    actorName?: string;
  }) => void;
  /** Callback when AI suggestion is ready */
  onAiSuggestionReady?: (payload: {
    questionId: string;
    questionTitle?: string;
  }) => void;
  /** Callback when question is resolved */
  onQuestionResolved?: (payload: { questionId: string }) => void;
}

/**
 * Hook return type
 */
interface UseQAWebSocketReturn {
  /** Whether the Realtime channel subscription is active */
  isConnected: boolean;
}

/**
 * Hook for subscribing to Q&A Supabase Realtime events for a specific question.
 *
 * When a questionId is provided, subscribes to:
 * - New answers (INSERT on answers table filtered by question_id)
 * - Question updates (UPDATE on questions table filtered by id)
 * - Answer updates such as acceptance (UPDATE on answers table filtered by question_id)
 *
 * Cache invalidation strategy:
 * - onNewAnswer: invalidates qaKeys.detail(questionId)
 * - onQuestionUpdated: invalidates qaKeys.detail(questionId) and qaKeys.lists()
 * - onAnswerUpdated: invalidates qaKeys.detail(questionId)
 *
 * @param options - Optional questionId and callback options for different event types
 * @returns Object with connection status
 *
 * @example
 * ```tsx
 * // On a question detail page - subscribes to Realtime for this question
 * const { isConnected } = useQAWebSocket({
 *   questionId: question.id,
 *   onNewAnswer: ({ actorName }) => {
 *     toast.info(`${actorName}님이 답변했습니다`);
 *   },
 * });
 *
 * // Without questionId - no Realtime subscription, isConnected stays false
 * const { isConnected } = useQAWebSocket({
 *   onNewAnswer: ({ questionId, actorName }) => {
 *     toast.info(`${actorName}님이 답변했습니다`);
 *   },
 * });
 * ```
 */
export function useQAWebSocket(
  options: UseQAWebSocketOptions = {}
): UseQAWebSocketReturn {
  const { questionId, onNewAnswer, onAiSuggestionReady, onQuestionResolved } =
    options;

  const queryClient = useQueryClient();
  const wsConnected = useQAStore((state: QAStore) => state.wsConnected);
  const setWsConnected = useQAStore((state: QAStore) => state.setWsConnected);

  useEffect(() => {
    // Only subscribe when a questionId is provided
    if (!questionId) {
      return;
    }

    setWsConnected(true);

    const channel = subscribeToQuestion(questionId, {
      /**
       * New answer inserted for this question.
       * REQ-BE-004-026: Invalidate question detail cache.
       */
      onNewAnswer: (payload) => {
        void queryClient.invalidateQueries({
          queryKey: qaKeys.detail(questionId),
        });

        // Forward to caller callback if provided
        onNewAnswer?.({
          questionId,
          answerId: '',
          questionTitle: undefined,
          actorName: undefined,
          ...extractAnswerPayload(payload),
        });
      },

      /**
       * Question status or upvote count updated.
       * REQ-BE-004-027: Invalidate both detail and list caches.
       */
      onQuestionUpdated: () => {
        void queryClient.invalidateQueries({
          queryKey: qaKeys.detail(questionId),
        });
        void queryClient.invalidateQueries({ queryKey: qaKeys.lists() });

        // Map to onQuestionResolved callback for status changes
        onQuestionResolved?.({ questionId });
      },

      /**
       * Answer updated (e.g., accepted as best answer).
       * Invalidate question detail to reflect acceptance state.
       */
      onAnswerUpdated: () => {
        void queryClient.invalidateQueries({
          queryKey: qaKeys.detail(questionId),
        });
      },
    });

    return () => {
      unsubscribeFromChannel(channel);
      setWsConnected(false);
    };
  }, [
    questionId,
    queryClient,
    setWsConnected,
    onNewAnswer,
    onAiSuggestionReady,
    onQuestionResolved,
  ]);

  return {
    isConnected: wsConnected,
  };
}

/**
 * Extracts answer-related fields from a Supabase Realtime payload.
 * The payload shape varies depending on the table and event type.
 */
function extractAnswerPayload(payload: unknown): {
  answerId?: string;
  questionTitle?: string;
  actorName?: string;
} {
  if (typeof payload !== 'object' || payload === null) {
    return {};
  }

  const record = (payload as Record<string, unknown>).new;
  if (typeof record !== 'object' || record === null) {
    return {};
  }

  const data = record as Record<string, unknown>;
  return {
    answerId: typeof data.id === 'string' ? data.id : undefined,
    questionTitle: undefined,
    actorName: undefined,
  };
}

export type { UseQAWebSocketReturn };
