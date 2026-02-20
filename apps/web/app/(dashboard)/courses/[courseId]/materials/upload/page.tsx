"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  Eye,
  Edit3,
  Upload,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { MaterialStatus } from "@shared";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { useAuthStore } from "~/stores/auth.store";
import { useCreateMaterial } from "~/hooks/materials";
import { useDebounce } from "~/hooks/useDebounce";
import { useBeforeUnload } from "~/hooks/useBeforeUnload";
import { DropZone } from "~/components/materials/DropZone";
import { MarkdownRenderer } from "~/components/markdown/MarkdownRenderer";
import { sanitizeMarkdown } from "~/lib/markdown";

// Form validation schema - input types (what the form fields accept)
const uploadFormInputSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  tagsInput: z.string().optional(), // Raw comma-separated string
  status: z.enum(["draft", "published"]).default("draft"),
  positionInput: z.string().optional(), // Raw string for position
});

type UploadFormInput = z.infer<typeof uploadFormInputSchema>;

// Output type after transformation
interface UploadFormOutput {
  title: string;
  tags: string[];
  status: "draft" | "published";
  position: number | undefined;
}

// Content size warning threshold (500KB)
const CONTENT_SIZE_WARNING = 500 * 1024;

/**
 * Parse and validate tags from input string
 */
function parseTags(input: string | undefined): string[] | null {
  if (!input?.trim()) return [];

  const tags = input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (tags.length > 10) {
    return null; // Invalid: too many tags
  }

  if (tags.some((t) => t.length > 50)) {
    return null; // Invalid: tag too long
  }

  return tags;
}

/**
 * Parse position from input string
 */
function parsePosition(input: string | undefined): number | undefined | false {
  if (!input?.trim()) return undefined;

  const parsed = parseInt(input, 10);
  if (isNaN(parsed) || parsed < 0) {
    return false; // Invalid
  }

  return parsed;
}

/**
 * Material Upload Page Inner Component
 * Separated to ensure hooks are called in correct order
 */
function MaterialUploadPageInner({
  courseId,
}: {
  courseId: string;
  isInstructor: boolean;
}) {
  const router = useRouter();

  // Form state
  const [content, setContent] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");
  const [tagError, setTagError] = useState<string | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty: isFormDirty },
    setValue,
  } = useForm<UploadFormInput>({
    resolver: zodResolver(uploadFormInputSchema as z.ZodType<UploadFormInput>),
    defaultValues: {
      title: "",
      tagsInput: "",
      status: "draft",
      positionInput: "",
    },
  });

  // Watch form values for preview
  const watchedTitle = watch("title");
  const watchedStatus = watch("status");
  const watchedTagsInput = watch("tagsInput");

  // Debounced content for preview (500ms)
  const debouncedContent = useDebounce(content, 500);

  // Parse tags for display
  const parsedTags = useMemo(() => {
    return (watchedTagsInput ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [watchedTagsInput]);

  // Preview content (debounced)
  const previewContent = useMemo(() => {
    return debouncedContent || "*No content yet*";
  }, [debouncedContent]);

  // Check for unsaved changes
  const hasUnsavedChanges = isFormDirty || content.length > 0;
  useBeforeUnload(hasUnsavedChanges);

  // Create material mutation
  const createMutation = useCreateMaterial(courseId);

  // Handle file accepted from DropZone
  const handleFileAccepted = (fileContent: string, filename: string): void => {
    // Sanitize content
    const sanitized = sanitizeMarkdown(fileContent);
    setContent(sanitized);

    // Auto-populate title from filename if not set
    if (!watchedTitle) {
      const titleFromFilename = filename
        .replace(/\.(md|markdown|txt)$/i, "")
        .replace(/[-_]/g, " ");
      setValue("title", titleFromFilename, { shouldDirty: true });
    }

    toast.success(`File "${filename}" loaded successfully`);
  };

  // Transform form data for submission
  const transformFormData = (
    data: UploadFormInput
  ): UploadFormOutput | null => {
    // Validate tags
    const tags = parseTags(data.tagsInput);
    if (tags === null) {
      setTagError("Maximum 10 tags, 50 characters each");
      return null;
    }
    setTagError(null);

    // Validate position
    const position = parsePosition(data.positionInput);
    if (position === false) {
      setPositionError("Position must be a non-negative integer");
      return null;
    }
    setPositionError(null);

    return {
      title: data.title,
      tags,
      status: data.status,
      position,
    };
  };

  // Handle form submission
  const onSubmit = (data: UploadFormInput): void => {
    // Validate content
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    // Transform and validate
    const transformed = transformFormData(data);
    if (!transformed) {
      return;
    }

    // Sanitize content before submission
    const sanitizedContent = sanitizeMarkdown(content);

    createMutation.mutate(
      {
        title: transformed.title,
        content: sanitizedContent,
        tags: transformed.tags,
        status: transformed.status as MaterialStatus,
        position: transformed.position,
      },
      {
        onSuccess: (material) => {
          toast.success("Material created successfully");
          router.push(`/courses/${courseId}/materials/${material.id}`);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to create material"
          );
        },
      }
    );
  };

  // Content size warning
  const showContentSizeWarning = content.length > CONTENT_SIZE_WARNING;
  const contentSizeKB = Math.round(content.length / 1024);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-[var(--color-muted-foreground)]"
          >
            <Link href={`/courses/${courseId}/materials`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Materials
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Upload Material
        </h1>
      </div>

      {/* Content size warning */}
      {showContentSizeWarning && (
        <div className="flex items-start gap-3 rounded-lg border border-[var(--color-warning-200)] bg-[var(--color-warning-50)] dark:border-[var(--color-warning-800)] dark:bg-[var(--color-warning-950)] p-4">
          <AlertTriangle className="h-5 w-5 text-[var(--color-warning-600)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--color-warning-700)] dark:text-[var(--color-warning-400)]">
              Large content detected ({contentSizeKB} KB)
            </p>
            <p className="text-sm text-[var(--color-warning-600)] dark:text-[var(--color-warning-500)] mt-1">
              Content larger than 500KB may affect rendering performance.
              Consider splitting into multiple materials.
            </p>
          </div>
        </div>
      )}

      {/* Main layout - split pane on desktop, tabs on mobile */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Content input tabs */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Content
            </h2>
            <Tabs
              value={uploadMode}
              onValueChange={(v: string) => {
                setUploadMode(v as "file" | "paste");
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="file" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  File Upload
                </TabsTrigger>
                <TabsTrigger value="paste" className="flex-1">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Paste/Write
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file">
                <DropZone
                  onFileAccepted={handleFileAccepted}
                  disabled={createMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="paste">
                <Textarea
                  placeholder="Paste or write your Markdown content here..."
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                  }}
                  disabled={createMutation.isPending}
                  className="min-h-[300px] font-mono text-sm"
                />
              </TabsContent>
            </Tabs>

            {/* Show loaded content info in file mode */}
            {uploadMode === "file" && content && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                <FileText className="h-4 w-4" />
                <span>{contentSizeKB} KB loaded</span>
              </div>
            )}
          </div>

          {/* Metadata form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-[var(--color-danger-500)]">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter material title"
                {...register("title")}
                disabled={createMutation.isPending}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-[var(--color-danger-500)]">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tagsInput">Tags (optional)</Label>
              <Input
                id="tagsInput"
                placeholder="Enter tags separated by commas"
                {...register("tagsInput")}
                disabled={createMutation.isPending}
                aria-describedby={tagError ? "tags-error" : "tags-hint"}
              />
              <p id="tags-hint" className="text-xs text-[var(--color-muted-foreground)]">
                Max 10 tags, 50 characters each
              </p>
              {tagError && (
                <p id="tags-error" className="text-sm text-[var(--color-danger-500)]">
                  {tagError}
                </p>
              )}
              {/* Tag badges */}
              {parsedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {parsedTags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watchedStatus}
                onValueChange={(value: string) => {
                  setValue("status", value as "draft" | "published", {
                    shouldDirty: true,
                  });
                }}
                disabled={createMutation.isPending}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Draft materials are only visible to instructors
              </p>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="positionInput">Position (optional)</Label>
              <Input
                id="positionInput"
                type="number"
                placeholder="Auto-positioned if empty"
                {...register("positionInput")}
                disabled={createMutation.isPending}
                min={0}
              />
              {positionError && (
                <p className="text-sm text-[var(--color-danger-500)]">
                  {positionError}
                </p>
              )}
            </div>

            {/* Submit button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || !content.trim()}
                className="flex-1"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Material
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          {/* Desktop: always visible */}
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview
            </h2>
            <div className="border rounded-lg p-4 mt-2 bg-[var(--color-background)] min-h-[500px] max-h-[80vh] overflow-auto">
              {/* Preview header */}
              {watchedTitle && (
                <h1 className="text-2xl font-bold mb-4 text-[var(--color-foreground)]">
                  {watchedTitle}
                </h1>
              )}
              {/* Markdown preview */}
              <article className="prose prose-neutral dark:prose-invert max-w-none">
                <MarkdownRenderer content={previewContent} />
              </article>
            </div>
          </div>

          {/* Mobile: tabs toggle */}
          <div className="lg:hidden">
            <Tabs
              value={previewTab}
              onValueChange={(v: string) => {
                setPreviewTab(v as "edit" | "preview");
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="edit" className="flex-1">
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex-1">
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview">
                <div className="border rounded-lg p-4 bg-[var(--color-background)] min-h-[300px] max-h-[60vh] overflow-auto">
                  {watchedTitle && (
                    <h1 className="text-xl font-bold mb-4 text-[var(--color-foreground)]">
                      {watchedTitle}
                    </h1>
                  )}
                  <article className="prose prose-neutral dark:prose-invert max-w-none">
                    <MarkdownRenderer content={previewContent} />
                  </article>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Material Upload Page
 * REQ-FE-340, 342, 343, 344, 347, 348: Instructor-only material creation page
 *
 * Features:
 * - Instructor-only route guard
 * - Two upload modes: File Upload and Paste/Write
 * - Metadata form with React Hook Form + Zod
 * - Split-pane layout: form + preview
 * - Content size warning for large files
 * - Unsaved changes warning
 * - Debounced preview (500ms)
 */
export default function MaterialUploadPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  // Auth state
  const role = useAuthStore((state) => state.role);
  const isInstructor = role === "instructor";

  // Redirect non-instructors
  useEffect(() => {
    if (role !== null && !isInstructor) {
      toast.error("Only instructors can upload materials");
      router.replace(`/courses/${courseId}/materials`);
    }
  }, [role, isInstructor, router, courseId]);

  // Show loading while checking auth
  if (role === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }

  // Don't render for non-instructors
  if (!isInstructor) {
    return null;
  }

  return <MaterialUploadPageInner courseId={courseId} isInstructor={isInstructor} />;
}
