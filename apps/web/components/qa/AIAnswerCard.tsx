/**
 * AIAnswerCard Component
 * TASK-028: AI suggestion display
 *
 * Renders AI-generated suggestion with distinctive styling.
 */

"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { MarkdownRenderer } from "~/components/markdown/MarkdownRenderer";
import { Sparkles, ThumbsUp, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import type { QAAnswer } from "@shared";

interface AIAnswerCardProps {
  answer: QAAnswer | null;
  isPending: boolean;
  onRequestNew?: () => void;
  className?: string;
}

/**
 * AIAnswerCard - AI suggestion display
 *
 * Features:
 * - Distinctive purple/blue gradient styling
 * - AI badge with sparkle icon
 * - Pending state with skeleton
 * - Request new suggestion button
 * - Markdown content rendering
 */
export function AIAnswerCard({
  answer,
  isPending,
  onRequestNew,
  className,
}: AIAnswerCardProps) {
  // Pending state
  if (isPending) {
    return (
      <Card
        className={cn(
          "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30",
          className
        )}
      >
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
              <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
            </div>
            <div>
              <div className="font-medium text-purple-900 dark:text-purple-100">
                AI 답변 생성 중
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                질문 내용을 분석하고 있습니다...
              </div>
            </div>
          </div>

          {/* Skeleton lines */}
          <div className="space-y-2">
            <div className="h-4 bg-purple-200/50 dark:bg-purple-800/50 rounded animate-pulse w-full" />
            <div className="h-4 bg-purple-200/50 dark:bg-purple-800/50 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-purple-200/50 dark:bg-purple-800/50 rounded animate-pulse w-4/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // No suggestion state
  if (!answer) {
    return null;
  }

  return (
    <Card
      className={cn(
        "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30",
        className
      )}
    >
      <CardContent className="py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-purple-900 dark:text-purple-100">
                  AI 추천 답변
                </span>
                <Badge
                  variant="outline"
                  className="text-xs text-purple-600 border-purple-300"
                >
                  참고용
                </Badge>
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                AI가 생성한 답변입니다
              </div>
            </div>
          </div>

          {/* Actions */}
          {onRequestNew && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRequestNew}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              다시 생성
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none dark:prose-invert prose-purple">
          <MarkdownRenderer content={answer.content} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
            <AlertCircle className="h-4 w-4" />
            <span>AI 답변은 참고용이며, 정확성을 확인해주세요.</span>
          </div>

          {/* Upvote count */}
          {answer.upvoteCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-purple-600">
              <ThumbsUp className="h-4 w-4" />
              <span>{answer.upvoteCount}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
