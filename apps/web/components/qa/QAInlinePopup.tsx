"use client";

/**
 * QAInlinePopup Component
 * TASK-032: Inline Q&A popup for desktop
 * REQ-FE-321: Inline Q&A popup component
 *
 * Features:
 * - Position near selected text using anchorRect
 * - Viewport-aware flip algorithm (below/above selection)
 * - Width: 480px desktop
 * - WCAG 2.1 AA: role="dialog", aria-modal="true", aria-label="Ask Question"
 * - Focus trap within popup
 * - Escape key closes popup
 * - Form with React Hook Form + Zod validation
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
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
import { useQAStore } from "~/stores/qa.store";
import { useCreateQuestion } from "~/hooks/qa";
import {
  CreateQuestionSchema,
  type CreateQuestionInput,
} from "@shared/validators/qa.schema";
import { cn } from "~/lib/utils";

const POPUP_WIDTH = 480;
const POPUP_HEIGHT_ESTIMATE = 420;
const PADDING = 8;

interface Position {
  top: number;
  left: number;
  placement: "below" | "above";
}

/**
 * Calculate popup position with viewport-aware flip
 */
function calculatePosition(anchorRect: DOMRect | null): Position {
  if (!anchorRect) {
    return { top: PADDING, left: PADDING, placement: "below" };
  }

  const scrollTop = window.scrollY;
  const scrollLeft = window.scrollX;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Default: position below selection
  let top = anchorRect.bottom + scrollTop + PADDING;
  let left = anchorRect.left + scrollLeft;
  let placement: "below" | "above" = "below";

  // Check if popup would overflow bottom of viewport
  const spaceBelow = viewportHeight - anchorRect.bottom;
  const spaceAbove = anchorRect.top;

  if (spaceBelow < POPUP_HEIGHT_ESTIMATE && spaceAbove > spaceBelow) {
    // Flip to above
    top = anchorRect.top + scrollTop - POPUP_HEIGHT_ESTIMATE - PADDING;
    placement = "above";
  }

  // Ensure popup stays within horizontal bounds
  if (left + POPUP_WIDTH > viewportWidth - PADDING) {
    left = viewportWidth - POPUP_WIDTH - PADDING;
  }

  // Ensure minimum left position
  left = Math.max(PADDING, left);

  // Ensure minimum top position
  top = Math.max(PADDING, top);

  return { top, left, placement };
}

/**
 * QAInlinePopup Component
 *
 * Desktop popup for creating questions from selected text.
 * Uses portal to render at document root for proper z-index stacking.
 */
export function QAInlinePopup() {
  const { inlinePopup, closeInlinePopup } = useQAStore();
  const { isOpen, anchorRect, context } = inlinePopup;
  const { mutate: createQuestion, isPending } = useCreateQuestion();
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({
    top: 0,
    left: 0,
    placement: "below",
  });

  const form = useForm<CreateQuestionInput>({
    resolver: zodResolver(CreateQuestionSchema),
    defaultValues: {
      title: "",
      content: "",
      courseId: "",
      materialId: context?.materialId ?? "",
      context: {
        materialId: context?.materialId ?? "",
        headingId: context?.headingId ?? null,
        selectedText: context?.selectedText ?? "",
      },
    },
  });

  // Update position when anchorRect changes
  useEffect(() => {
    if (isOpen && anchorRect) {
      const newPosition = calculatePosition(anchorRect);
      setPosition(newPosition);
    }
  }, [isOpen, anchorRect]);

  // Update form context when popup context changes
  useEffect(() => {
    if (context) {
      form.setValue("courseId", context.courseId);
      form.setValue("materialId", context.materialId);
      form.setValue("context.materialId", context.materialId);
      form.setValue("context.headingId", context.headingId ?? null);
      form.setValue("context.selectedText", context.selectedText);
    }
  }, [context, form]);

  // Focus management - focus first input when popup opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        form.setFocus("title");
      }, 100);
      return () => { clearTimeout(timer); };
    }
  }, [isOpen, form]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeInlinePopup();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => { window.removeEventListener("keydown", handleEscape); };
  }, [isOpen, closeInlinePopup]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        closeInlinePopup();
      }
    };
    if (isOpen) {
      // Delay to avoid closing immediately on the same click that opened it
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, closeInlinePopup]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const popup = popupRef.current;
    if (!popup) return;

    const focusableElements = popup.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    popup.addEventListener("keydown", handleTabKey);
    return () => { popup.removeEventListener("keydown", handleTabKey); };
  }, [isOpen]);

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

  const handleClose = useCallback(() => {
    form.reset();
    closeInlinePopup();
  }, [form, closeInlinePopup]);

  // Don't render if not open or no context
  if (!isOpen || !context) return null;

  return createPortal(
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="true"
      aria-label="질문하기"
      className={cn(
        "fixed z-[60] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        position.placement === "below" && "data-[state=open]:slide-in-from-top-2",
        position.placement === "above" && "data-[state=open]:slide-in-from-bottom-2"
      )}
      style={{
        top: position.top,
        left: position.left,
        width: POPUP_WIDTH,
      }}
      data-placement={position.placement}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          질문하기
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8"
          aria-label="팝업 닫기"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Context snippet */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <div className="p-3 bg-[var(--color-muted)] rounded-md border-l-4 border-[var(--color-primary-500)]">
          <p className="text-sm text-[var(--color-muted-foreground)] italic line-clamp-3">
            "{context.selectedText}"
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-4 space-y-4"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>제목</FormLabel>
                <FormControl>
                  <Input
                    placeholder="질문의 제목을 입력하세요"
                    {...field}
                    disabled={isPending}
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
                <FormLabel>내용</FormLabel>
                <FormControl>
                  <EditorWithPreview
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="질문 내용을 상세히 작성하세요 (마크다운 지원)"
                    initialTab="editor"
                    height={150}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  등록 중...
                </>
              ) : (
                "질문 등록"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>,
    document.body
  );
}
