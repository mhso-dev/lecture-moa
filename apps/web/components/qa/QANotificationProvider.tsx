/**
 * Q&A Notification Provider
 * TASK-035: Toast Notifications for Q&A WebSocket events
 * REQ-FE-546: In-App Toast Notifications
 * REQ-FE-547: AI Suggestion Toast Notification
 * REQ-FE-548: Notification Persistence in Store
 *
 * Wires WebSocket events to Toast notifications using Sonner.
 * Handles QA_ANSWER_POSTED and QA_AI_SUGGESTION_READY events.
 */

"use client";

import { ReactNode } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQAWebSocket } from "~/hooks/qa";
import { useQAStore } from "~/stores/qa.store";

interface QANotificationProviderProps {
  children: ReactNode;
}

/**
 * Provider component that subscribes to Q&A WebSocket events
 * and displays toast notifications.
 *
 * Features:
 * - Shows toast when new answer is posted (if not viewing that question)
 * - Shows toast when AI suggestion is ready (if not viewing that question)
 * - Toasts include clickable links to navigate to question detail
 * - Notifications are persisted in qa.store for badge display
 */
export function QANotificationProvider({
  children,
}: QANotificationProviderProps) {
  const router = useRouter();
  const addNotification = useQAStore((state) => state.addNotification);
  const activeQuestionId = useQAStore((state) => state.activeQuestionId);

  useQAWebSocket({
    onNewAnswer: (payload) => {
      // Don't notify if user is viewing that question
      if (activeQuestionId === payload.questionId) return;

      // Add notification to store for badge display
      addNotification({
        id: `answer-${payload.answerId}`,
        type: "NEW_ANSWER",
        questionId: payload.questionId,
        questionTitle: payload.questionTitle ?? "",
        actorName: payload.actorName,
        receivedAt: new Date().toISOString(),
      });

      // Show toast notification with navigation action
      toast.success(`${payload.actorName ?? ""}님이 답변했습니다`, {
        description: payload.questionTitle,
        action: {
          label: "보기",
          onClick: () => { router.push(`/qa/${payload.questionId}`); },
        },
        duration: 6000,
      });
    },
    onAiSuggestionReady: (payload) => {
      // Don't notify if user is viewing that question
      if (activeQuestionId === payload.questionId) return;

      // Add notification to store for badge display
      addNotification({
        id: `ai-${payload.questionId}-${Date.now().toString()}`,
        type: "AI_SUGGESTION_READY",
        questionId: payload.questionId,
        questionTitle: payload.questionTitle ?? "",
        receivedAt: new Date().toISOString(),
      });

      // Show toast notification with navigation action
      toast.success("AI가 답변을 제안했습니다", {
        description: payload.questionTitle,
        action: {
          label: "보기",
          onClick: () => { router.push(`/qa/${payload.questionId}`); },
        },
        duration: 8000,
      });
    },
    onQuestionResolved: (payload) => {
      // Invalidate queries is handled by useQAWebSocket
      // Optionally show toast for resolved questions
      // For now, we just let the query refetch silently
      void payload;
    },
  });

  return <>{children}</>;
}
