/**
 * QAAIRequestButton Component
 * TASK-029: AI suggestion request trigger
 *
 * Button to request AI-generated answer suggestion.
 */

"use client";

import { Button } from "~/components/ui/button";
import { useRequestAISuggestion } from "~/hooks/qa";
import { useAuthStore } from "~/stores/auth.store";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface QAAIRequestButtonProps {
  questionId: string;
  hasAISuggestion: boolean;
  isPending: boolean;
  className?: string;
}

/**
 * QAAIRequestButton - AI suggestion request trigger
 *
 * Features:
 * - Sparkle icon
 * - Loading state during request
 * - Disabled when suggestion exists or pending
 * - Only visible for students
 */
export function QAAIRequestButton({
  questionId,
  hasAISuggestion,
  isPending,
  className,
}: QAAIRequestButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const requestMutation = useRequestAISuggestion(questionId);

  // Don't show if already has suggestion or is pending
  if (hasAISuggestion || isPending) {
    return null;
  }

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const handleClick = () => {
    requestMutation.mutate();
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={requestMutation.isPending}
      className={cn(
        "border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950",
        className
      )}
    >
      {requestMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          요청 중...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          AI 답변 요청
        </>
      )}
    </Button>
  );
}
