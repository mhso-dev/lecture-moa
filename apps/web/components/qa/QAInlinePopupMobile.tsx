"use client";

/**
 * QAInlinePopupMobile Component
 * TASK-033: Mobile variant using Sheet component
 * REQ-FE-321: Inline Q&A popup component (mobile)
 *
 * Features:
 * - Uses Sheet component for mobile (< 768px)
 * - Same form structure as desktop
 * - Touch-friendly interactions
 * - Swipe-to-close support
 */

import { useEffect, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import EditorWithPreview from "~/components/markdown/EditorWithPreview";
import { useQAStore } from "~/stores/qa.store";
import { useCreateQuestion } from "~/hooks/qa";
import {
  CreateQuestionSchema,
  type CreateQuestionInput,
} from "@shared/validators/qa.schema";

/**
 * QAInlinePopupMobile Component
 *
 * Mobile-friendly bottom sheet for creating questions from selected text.
 * Provides touch-optimized form with swipe-to-close support.
 */
export function QAInlinePopupMobile() {
  const { inlinePopup, closeInlinePopup } = useQAStore();
  const { isOpen, context } = inlinePopup;
  const { mutate: createQuestion, isPending } = useCreateQuestion();
  const [isMobile, setIsMobile] = useState(false);

  const form = useForm<CreateQuestionInput>({
    resolver: zodResolver(CreateQuestionSchema),
    defaultValues: {
      title: "",
      content: "",
      courseId: "",
      materialId: context?.materialId || "",
      context: {
        materialId: context?.materialId || "",
        headingId: context?.headingId || null,
        selectedText: context?.selectedText || "",
      },
    },
  });

  // Check if mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update form context when popup context changes
  useEffect(() => {
    if (context) {
      form.setValue("courseId", context.courseId);
      form.setValue("materialId", context.materialId);
      form.setValue("context.materialId", context.materialId);
      form.setValue("context.headingId", context.headingId || null);
      form.setValue("context.selectedText", context.selectedText);
    }
  }, [context, form]);

  // Focus first input when sheet opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        form.setFocus("title");
      }, 300); // Wait for sheet animation
      return () => clearTimeout(timer);
    }
  }, [isOpen, form]);

  const onSubmit = useCallback(
    (data: CreateQuestionInput) => {
      // Ensure courseId is included from context
      if (!context?.courseId) {
        console.error("CourseId is required but not provided in context");
        return;
      }

      createQuestion(
        {
          ...data,
          courseId: context.courseId,
        },
        {
          onSuccess: () => {
            form.reset();
            closeInlinePopup();
          },
        }
      );
    },
    [createQuestion, form, closeInlinePopup, context?.courseId]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        form.reset();
        closeInlinePopup();
      }
    },
    [form, closeInlinePopup]
  );

  // Don't render on desktop
  if (!isMobile) return null;

  // Don't render if no context
  if (!context) return null;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[600px] px-4 pt-4 pb-6 overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">Ask Question</SheetTitle>
          <SheetDescription className="text-left">
            Create a question about the selected text
          </SheetDescription>
        </SheetHeader>

        {/* Context snippet */}
        <div className="mb-4 p-3 bg-[var(--color-muted)] rounded-md border-l-4 border-[var(--color-primary-500)]">
          <p className="text-sm text-[var(--color-muted-foreground)] italic line-clamp-3">
            "{context.selectedText}"
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a descriptive title for your question"
                      {...field}
                      disabled={isPending}
                      className="h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <EditorWithPreview
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Describe your question in detail (Markdown supported)"
                      initialTab="editor"
                      height={180}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 sticky bottom-0 bg-[var(--color-background)] py-2 -mx-4 px-4 border-t border-[var(--color-border)]">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                className="w-full sm:w-auto h-12 sm:h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto h-12 sm:h-10"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Question"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
