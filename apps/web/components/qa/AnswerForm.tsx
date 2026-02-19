/**
 * AnswerForm Component
 * TASK-027: Answer submission form
 *
 * Form for creating new answers using EditorWithPreview.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import EditorWithPreview from "~/components/markdown/EditorWithPreview";
import { useCreateAnswer } from "~/hooks/qa";
import { useAuthStore } from "~/stores/auth.store";
import { Send, Lock } from "lucide-react";
import { cn } from "~/lib/utils";

interface AnswerFormProps {
  questionId: string;
  questionStatus: "OPEN" | "RESOLVED" | "CLOSED";
  onSuccess?: () => void;
  className?: string;
}

/**
 * AnswerForm - Answer submission form
 *
 * Features:
 * - EditorWithPreview for markdown editing
 * - Submit button with loading state
 * - Disabled when question is closed
 * - Login prompt for unauthenticated users
 */
export function AnswerForm({
  questionId,
  questionStatus,
  onSuccess,
  className,
}: AnswerFormProps) {
  const [content, setContent] = useState("");

  const { user } = useAuthStore();
  const createMutation = useCreateAnswer(questionId);

  const isClosed = questionStatus === "CLOSED";
  const isResolved = questionStatus === "RESOLVED";
  const canSubmit = content.trim().length >= 10 && !createMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    try {
      await createMutation.mutateAsync(content.trim());
      setContent("");
      onSuccess?.();
    } catch {
      // Error is handled by mutation
    }
  };

  // Unauthenticated state
  if (!user) {
    return (
      <Card className={cn("bg-muted/30", className)}>
        <CardContent className="py-8 text-center">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">
            답변을 작성하려면 로그인이 필요합니다
          </p>
          <Button asChild>
            <a href="/login">로그인하기</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Closed question state
  if (isClosed) {
    return (
      <Card className={cn("bg-muted/30", className)}>
        <CardContent className="py-8 text-center">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            종료된 질문에는 답변을 작성할 수 없습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">답변 작성</CardTitle>
        {isResolved && (
          <p className="text-sm text-muted-foreground">
            이 질문은 이미 해결되었습니다. 추가 답변을 작성할 수 있습니다.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Editor */}
          <EditorWithPreview
            value={content}
            onChange={setContent}
            placeholder="답변을 마크다운으로 작성하세요... (최소 10자)"
            disabled={createMutation.isPending}
            initialTab="editor"
            className="min-h-[200px]"
          />

          {/* Validation message */}
          {content.length > 0 && content.trim().length < 10 && (
            <p className="text-sm text-muted-foreground">
              최소 10자 이상 입력해주세요 ({content.trim().length}/10)
            </p>
          )}

          {/* Submit button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[120px]"
            >
              {createMutation.isPending ? (
                "등록 중..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  답변 등록
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
