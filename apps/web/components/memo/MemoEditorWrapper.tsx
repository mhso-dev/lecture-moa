/**
 * MemoEditorWrapper Component
 * REQ-FE-761, REQ-FE-762: Wrapper for memo editor with form fields
 *
 * Features:
 * - WRAPS existing EditorWithPreview from components/markdown/
 * - Form fields above editor: Title, Tags, MaterialLink, Team toggle
 * - Integrates with memo.store.ts for editorMode
 * - Uses existing MarkdownRenderer for preview
 * - Does NOT create new markdown editor component
 */

"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, X, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import EditorWithPreview from "~/components/markdown/EditorWithPreview";
import { MaterialLinkDialog } from "./MaterialLinkDialog";
import { cn } from "~/lib/utils";
import { useMemoEditorStore } from "~/stores/memo.store";
import { CreateMemoSchema } from "@shared/validators/memo.schema";
import type { MemoLinkTarget } from "@shared/types/memo.types";
import type * as z from "zod";

type MemoFormValues = z.infer<typeof CreateMemoSchema>;

/**
 * Props for MemoEditorWrapper component
 */
interface MemoEditorWrapperProps {
  /** Initial values for editing existing memo */
  initialValues?: Partial<MemoFormValues> & {
    materialTitle?: string;
    anchorText?: string;
    courseId?: string;
  };
  /** Team ID for team memos (shows team toggle) */
  teamId?: string;
  /** Team name for display */
  teamName?: string;
  /** Callback when form is submitted */
  onSubmit: (values: MemoFormValues) => void;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Mock data for demo (would come from props/API in production)
 */
const mockCourses = [
  { id: "course-1", name: "React Fundamentals" },
  { id: "course-2", name: "TypeScript Deep Dive" },
];

const mockMaterials = [
  { id: "mat-1", title: "Introduction to React", courseId: "course-1" },
  { id: "mat-2", title: "React Hooks Guide", courseId: "course-1" },
  { id: "mat-3", title: "TypeScript Generics", courseId: "course-2" },
];

/**
 * MemoEditorWrapper - Wrapper for memo editor with form fields
 * REQ-FE-761: Wraps EditorWithPreview for memo context
 * REQ-FE-762: Form fields above editor (Title, Tags, MaterialLink, Team toggle)
 *
 * @param props - Component props
 * @returns MemoEditorWrapper component
 *
 * @example
 * ```tsx
 * <MemoEditorWrapper
 *   initialValues={memo}
 *   teamId={teamId}
 *   teamName={teamName}
 *   onSubmit={handleSubmit}
 *   isSubmitting={isSubmitting}
 * />
 * ```
 */
export function MemoEditorWrapper({
  initialValues,
  teamId,
  teamName,
  onSubmit,
  isSubmitting = false,
  className,
}: MemoEditorWrapperProps) {
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [linkTarget, setLinkTarget] = useState<MemoLinkTarget | null>(
    initialValues?.materialId
      ? {
          materialId: initialValues.materialId,
          materialTitle: initialValues.materialTitle ?? "Material",
          courseId: initialValues.courseId ?? "",
          anchorId: initialValues.anchorId ?? null,
          anchorText: initialValues.anchorText ?? null,
        }
      : null
  );

  const { setDirty } = useMemoEditorStore();

  // Initialize form with react-hook-form + Zod
  const form = useForm<MemoFormValues>({
    resolver: zodResolver(CreateMemoSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      content: initialValues?.content ?? "",
      tags: initialValues?.tags ?? [],
      materialId: initialValues?.materialId ?? undefined,
      anchorId: initialValues?.anchorId ?? undefined,
      teamId: teamId ?? initialValues?.teamId ?? undefined,
      visibility: teamId ? "team" : (initialValues?.visibility ?? "personal"),
    },
  });

  const { watch, setValue } = form;
  const content = watch("content");
  const tags = watch("tags");
  const teamToggle = watch("visibility") === "team";

  /**
   * Handle content change from editor
   */
  const handleContentChange = useCallback(
    (newContent: string) => {
      setValue("content", newContent);
      setDirty(true);
    },
    [setValue, setDirty]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = (values: MemoFormValues) => {
    // Add materialId and anchorId from linkTarget
    const finalValues: MemoFormValues = {
      ...values,
      materialId: linkTarget?.materialId,
      anchorId: linkTarget?.anchorId ?? undefined,
    };

    onSubmit(finalValues);
    setDirty(false);
  };

  /**
   * Handle tag input
   */
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    const normalizedTag = tagInput.trim().toLowerCase();
    if (
      normalizedTag &&
      !tags?.includes(normalizedTag) &&
      (tags?.length ?? 0) < 10 &&
      normalizedTag.length <= 30
    ) {
      setValue("tags", [...(tags ?? []), normalizedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags?.filter((tag: string) => tag !== tagToRemove) ?? []
    );
  };

  /**
   * Handle material link
   */
  const handleMaterialLink = (materialId: string, anchorId: string | null) => {
    const material = mockMaterials.find((m) => m.id === materialId);
    if (material) {
      setLinkTarget({
        materialId,
        materialTitle: material.title,
        courseId: material.courseId,
        anchorId,
        anchorText: null, // Would be fetched from TOC in production
      });
      setValue("materialId", materialId);
      setValue("anchorId", anchorId ?? undefined);
    }
    setShowMaterialDialog(false);
  };

  const handleClearMaterialLink = () => {
    setLinkTarget(null);
    setValue("materialId", undefined);
    setValue("anchorId", undefined);
  };

  /**
   * Handle team toggle
   */
  const handleTeamToggle = (checked: boolean) => {
    setValue("visibility", checked ? "team" : "personal");
    if (checked && teamId) {
      setValue("teamId", teamId);
    } else {
      setValue("teamId", undefined);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Title Input */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>제목</FormLabel>
                <FormControl>
                  <Input
                    placeholder="메모 제목을 입력하세요..."
                    maxLength={200}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setDirty(true);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  {field.value.length}/200자
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tag Input */}
          <div className="space-y-2">
            <Label>태그 (선택사항, 최대 10개)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="태그를 입력하세요..."
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                maxLength={30}
                disabled={(tags?.length ?? 0) >= 10}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
                disabled={(tags?.length ?? 0) >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => { handleRemoveTag(tag); }}
                      className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-muted)]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <FormDescription>
              {(tags?.length ?? 0)}/10개 태그 - 각 태그 최대 30자
            </FormDescription>
          </div>

          {/* Material Link */}
          <div className="space-y-2">
            <Label>자료 연결 (선택사항)</Label>
            {linkTarget ? (
              <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <span>{linkTarget.materialTitle}</span>
                  {linkTarget.anchorText && (
                    <>
                      <span className="text-[var(--color-muted-foreground)]">/</span>
                      <span>{linkTarget.anchorText}</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowMaterialDialog(true); }}
                  >
                    변경
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearMaterialLink}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowMaterialDialog(true); }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                자료 연결
              </Button>
            )}
          </div>

          {/* Team Toggle (only when teamId context provided) */}
          {teamId && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-border)]">
              <div className="space-y-0.5">
                <Label>팀과 공유</Label>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {teamToggle
                    ? `이 메모는 ${teamName ?? "팀"}에 공유됩니다`
                    : "이 메모는 본인만 볼 수 있습니다"}
                </p>
              </div>
              <Switch
                checked={teamToggle}
                onCheckedChange={handleTeamToggle}
              />
            </div>
          )}

          {/* Editor with Preview */}
          <FormField
            control={form.control}
            name="content"
            render={() => (
              <FormItem>
                <FormControl>
                  <EditorWithPreview
                    value={content}
                    onChange={handleContentChange}
                    height={500}
                    placeholder="메모를 작성하세요..."
                    showPreview={true}
                    initialTab="editor"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? "저장 중..." : "메모 저장"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Material Link Dialog */}
      <MaterialLinkDialog
        open={showMaterialDialog}
        onOpenChange={setShowMaterialDialog}
        currentLink={linkTarget}
        onLink={handleMaterialLink}
        onClear={handleClearMaterialLink}
        courses={mockCourses}
        materials={mockMaterials}
      />
    </div>
  );
}

export type { MemoEditorWrapperProps };
