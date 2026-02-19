/**
 * QAContent Component
 * Client component for Q&A detail page content
 * TASK-036: Notification Store Persistence - clear specific notifications
 *
 * Note: The API should return question detail with embedded answers.
 * If answers are fetched separately, a useQuestionAnswers hook should be used.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useQADetail, useChangeQuestionStatus, useRequestAISuggestion, qaKeys } from "~/hooks/qa";
import { QuestionCard } from "~/components/qa/QuestionCard";
import { AIAnswerCard } from "~/components/qa/AIAnswerCard";
import { AnswerThread } from "~/components/qa/AnswerThread";
import { AnswerForm } from "~/components/qa/AnswerForm";
import { QAAIRequestButton } from "~/components/qa/QAAIRequestButton";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/lib/api";
import { useQAStore } from "~/stores/qa.store";
import type { QAAnswer } from "@shared";

/**
 * Hook for fetching answers for a question
 * TODO: This could be merged into useQADetail if the API returns answers together
 */
function useQuestionAnswers(questionId: string) {
  return useQuery({
    queryKey: [...qaKeys.detail(questionId), "answers"],
    queryFn: async () => {
      const response = await api.get<QAAnswer[]>(
        `/api/v1/qa/questions/${questionId}/answers`
      );
      return response.data;
    },
    enabled: !!questionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

interface QAContentProps {
  questionId: string;
}

/**
 * QAContent - Q&A detail page content
 *
 * Features:
 * - Question card with edit/delete
 * - AI suggestion section
 * - Answer thread with sorting
 * - Answer form
 * - Real-time updates via polling
 */
export function QADetailContent({ questionId }: QAContentProps) {
  const { data: question, isLoading, isError, error } = useQADetail(questionId);
  const { data: answers = [] } = useQuestionAnswers(questionId);
  const statusMutation = useChangeQuestionStatus(questionId);
  const aiRequestMutation = useRequestAISuggestion(questionId);

  // Notification state management
  const setActiveQuestion = useQAStore((state) => state.setActiveQuestion);
  const clearActiveQuestion = useQAStore((state) => state.clearActiveQuestion);
  const clearNotification = useQAStore((state) => state.clearNotification);
  const pendingNotifications = useQAStore((state) => state.pendingNotifications);

  // Set active question on mount and clear on unmount
  useEffect(() => {
    setActiveQuestion(questionId);

    return () => {
      clearActiveQuestion();
    };
  }, [questionId, setActiveQuestion, clearActiveQuestion]);

  // Clear notifications for this specific question
  useEffect(() => {
    pendingNotifications
      .filter((n) => n.questionId === questionId)
      .forEach((n) => clearNotification(n.id));
  }, [questionId, pendingNotifications, clearNotification]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-6 max-w-4xl">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-48 w-full mb-6 rounded-lg" />
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !question) {
    return (
      <div className="container py-6 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            질문을 불러오는 중 오류가 발생했습니다.
          </p>
          <p className="text-sm text-destructive mb-4">{error?.message}</p>
          <Button asChild variant="outline">
            <Link href="/qa">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Handle status change
  const handleStatusChange = async (status: "OPEN" | "RESOLVED" | "CLOSED") => {
    try {
      await statusMutation.mutateAsync(status);
      toast.success(`질문 상태가 변경되었습니다`);
    } catch {
      // Error handled by mutation
    }
  };

  // Handle delete
  const handleDelete = () => {
    // Delete is handled by parent or navigation
    // This would typically navigate back to list after delete
  };

  // Handle AI request
  const handleAIRequest = () => {
    aiRequestMutation.mutate();
  };

  return (
    <div className="container py-6 max-w-4xl">
      {/* Back navigation */}
      <Button asChild variant="ghost" className="mb-4 -ml-2">
        <Link href="/qa">
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Link>
      </Button>

      {/* Question card */}
      <QuestionCard
        question={question}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        className="mb-6"
      />

      {/* AI Suggestion section */}
      {(question.aiSuggestion || question.aiSuggestionPending) && (
        <div className="mb-6">
          <AIAnswerCard
            answer={question.aiSuggestion}
            isPending={question.aiSuggestionPending}
            onRequestNew={handleAIRequest}
          />
        </div>
      )}

      {/* AI Request button */}
      {!question.aiSuggestion && !question.aiSuggestionPending && (
        <div className="mb-6">
          <QAAIRequestButton
            questionId={questionId}
            hasAISuggestion={!!question.aiSuggestion}
            isPending={question.aiSuggestionPending}
          />
        </div>
      )}

      {/* Answer thread */}
      <AnswerThread
        question={question}
        answers={answers}
        onAnswerAccept={() => {
          // Refetch happens automatically via cache invalidation
        }}
        className="mb-6"
      />

      {/* Answer form */}
      <AnswerForm
        questionId={questionId}
        questionStatus={question.status}
        onSuccess={() => {
          // Refetch happens automatically via cache invalidation
        }}
      />
    </div>
  );
}
