/**
 * QuestionEditForm Component
 * TASK-024: Inline edit form for questions
 *
 * Allows question authors to edit title and content.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import EditorWithPreview from "~/components/markdown/EditorWithPreview";
import { useUpdateQuestion } from "~/hooks/qa";
import { CreateQuestionSchema } from "@shared/validators/qa.schema";
import { cn } from "~/lib/utils";
import type { QAQuestion } from "@shared";

interface QuestionEditFormProps {
  question: QAQuestion;
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  title: string;
  content: string;
}

/**
 * QuestionEditForm - Inline edit form for questions
 *
 * Features:
 * - Pre-fill title and content
 * - Uses EditorWithPreview for content
 * - Same validation as create form
 * - Context is not editable
 */
export function QuestionEditForm({
  question,
  onSave,
  onCancel,
  className,
}: QuestionEditFormProps) {
  const [content, setContent] = useState(question.content);

  const form = useForm<FormData>({
    resolver: zodResolver(CreateQuestionSchema),
    defaultValues: {
      title: question.title,
      content: question.content,
    },
  });

  const updateMutation = useUpdateQuestion(question.id);

  const onSubmit = async (data: FormData) => {
    try {
      await updateMutation.mutateAsync({
        title: data.title,
        content: content,
      });
      onSave?.();
    } catch (error) {
      // Error is handled by mutation
    }
  };

  return (
    <Card className={cn("border-primary", className)}>
      <CardHeader>
        <CardTitle className="text-lg">질문 수정</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="질문 제목을 입력하세요"
                      disabled={updateMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Context (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">컨텍스트 (수정 불가)</label>
              <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-muted-foreground">
                <p className="text-sm text-muted-foreground italic">
                  "{question.context.selectedText}"
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">내용</label>
              <EditorWithPreview
                value={content}
                onChange={setContent}
                placeholder="질문 내용을 마크다운으로 작성하세요..."
                disabled={updateMutation.isPending}
                initialTab="editor"
                className="min-h-[200px]"
              />
              {form.formState.errors.content && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={updateMutation.isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
