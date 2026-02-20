/**
 * useQAWebSocket Hook - WebSocket Subscription for Q&A Events
 * TASK-014: WebSocket subscription hook for Q&A events
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-545: WebSocket connection for Q&A
 *
 * Subscribes to Q&A WebSocket events and manages real-time updates.
 * Follows pattern from hooks/dashboard/useStudentRealtimeUpdates.ts
 */

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQAStore } from '~/stores/qa.store';
import { qaKeys } from './qa-keys';
import { EVENTS } from '@shared/constants/events';

/**
 * WebSocket event payload types
 */
interface QAWebSocketEvent {
  type: string;
  questionId: string;
}

interface NewAnswerEvent extends QAWebSocketEvent {
  answerId: string;
  actorName: string;
  questionTitle: string;
}

interface AISuggestionReadyEvent extends QAWebSocketEvent {
  questionTitle: string;
}

interface QuestionResolvedEvent extends QAWebSocketEvent {
  courseId: string;
}

/**
 * Options for useQAWebSocket hook
 */
export interface UseQAWebSocketOptions {
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
  /** Whether the WebSocket connection is established */
  isConnected: boolean;
}

/**
 * Hook for subscribing to Q&A WebSocket events
 *
 * @param options - Callback options for different event types
 * @returns Object with connection status
 *
 * @example
 * ```tsx
 * const { isConnected } = useQAWebSocket({
 *   onNewAnswer: ({ questionId, actorName }) => {
 *     toast.info(`${actorName}님이 답변했습니다`);
 *   },
 *   onAiSuggestionReady: ({ questionId }) => {
 *     toast.info('AI 답변이 준비되었습니다');
 *   },
 * });
 *
 * return (
 *   <div className={isConnected ? 'text-green-500' : 'text-gray-400'}>
 *     {isConnected ? 'Connected' : 'Offline'}
 *   </div>
 * );
 * ```
 */
export function useQAWebSocket(
  options: UseQAWebSocketOptions = {}
): UseQAWebSocketReturn {
  const { onNewAnswer, onAiSuggestionReady, onQuestionResolved } = options;

  const queryClient = useQueryClient();
  const wsConnected = useQAStore((state) => state.wsConnected);
  const setWsConnected = useQAStore((state) => state.setWsConnected);
  const addNotification = useQAStore((state) => state.addNotification);
  const activeQuestionId = useQAStore((state) => state.activeQuestionId);

  /**
   * Type guard for QAWebSocketEvent
   */
  function isQAWebSocketEvent(value: unknown): value is QAWebSocketEvent {
    return (
      typeof value === "object" &&
      value !== null &&
      "type" in value &&
      "questionId" in value
    );
  }

  /**
   * Handle WebSocket messages
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        // WebSocket message data is always a string
        const eventData = event.data as string;
        const parsed: unknown = JSON.parse(eventData);
        if (!isQAWebSocketEvent(parsed)) {
          return;
        }
        const data = parsed;

        switch (data.type) {
          case EVENTS.QA_ANSWER_POSTED: {
            const payload = data as NewAnswerEvent;

            // Invalidate question detail to refetch
            void queryClient.invalidateQueries({
              queryKey: qaKeys.detail(payload.questionId),
            });

            // Call callback if provided
            onNewAnswer?.({
              questionId: payload.questionId,
              answerId: payload.answerId,
              questionTitle: payload.questionTitle,
              actorName: payload.actorName,
            });

            // Add notification if not viewing this question
            if (activeQuestionId !== payload.questionId) {
              addNotification({
                id: `answer-${payload.answerId}`,
                type: 'NEW_ANSWER',
                questionId: payload.questionId,
                questionTitle: payload.questionTitle,
                actorName: payload.actorName,
                receivedAt: new Date().toISOString(),
              });
            }
            break;
          }

          case EVENTS.QA_AI_SUGGESTION_READY: {
            const payload = data as AISuggestionReadyEvent;

            // Invalidate question detail to refetch
            void queryClient.invalidateQueries({
              queryKey: qaKeys.detail(payload.questionId),
            });

            // Call callback if provided
            onAiSuggestionReady?.({
              questionId: payload.questionId,
              questionTitle: payload.questionTitle,
            });

            // Add notification if not viewing this question
            if (activeQuestionId !== payload.questionId) {
              addNotification({
                id: `ai-${payload.questionId}-${Date.now().toString()}`,
                type: 'AI_SUGGESTION_READY',
                questionId: payload.questionId,
                questionTitle: payload.questionTitle,
                receivedAt: new Date().toISOString(),
              });
            }
            break;
          }

          case EVENTS.QA_QUESTION_RESOLVED: {
            const payload = data as QuestionResolvedEvent;

            // Invalidate both detail and list
            void queryClient.invalidateQueries({
              queryKey: qaKeys.detail(payload.questionId),
            });
            void queryClient.invalidateQueries({ queryKey: qaKeys.lists() });

            // Call callback if provided
            onQuestionResolved?.({ questionId: payload.questionId });
            break;
          }
        }
      } catch {
        // Ignore parse errors for non-JSON messages
      }
    },
    [
      queryClient,
      onNewAnswer,
      onAiSuggestionReady,
      onQuestionResolved,
      activeQuestionId,
      addNotification,
    ]
  );

  /**
   * Setup WebSocket connection
   */
  useEffect(() => {
    // TODO: Implement WebSocket connection when WS SPEC is available
    // The implementation should:
    // 1. Connect to WebSocket endpoint (e.g., /ws/qa)
    // 2. Handle authentication via JWT token
    // 3. Subscribe to Q&A event channels
    // 4. Call handleMessage on received messages
    // 5. Handle reconnection with exponential backoff
    // 6. Update wsConnected state
    // 7. Clean up connection on unmount

    // For now, set up a placeholder that calls handlers
    // This will be replaced with actual WebSocket implementation

    return () => {
      // Cleanup on unmount
      setWsConnected(false);
    };
  }, [setWsConnected, handleMessage]);

  return {
    isConnected: wsConnected,
  };
}

export type { UseQAWebSocketReturn };
