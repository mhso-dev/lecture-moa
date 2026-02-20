/**
 * QuizForm Component
 * REQ-FE-630, REQ-FE-633, REQ-FE-634, REQ-FE-635: Quiz creation form
 *
 * Features:
 * - React Hook Form with CreateQuizSchema validation
 * - All form fields for quiz configuration
 * - Auto-save indicator ("Saving..." / "Saved")
 * - Warning when editing published quiz
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Check } from "lucide-react";
import {
  CreateQuizSchema,
  type CreateQuizSchemaInput,
} from "@shared/validators/quiz.schema";
import { useDebounce } from "~/hooks/useDebounce";
import type { QuizDetail, CreateQuizInput } from "@shared/types/quiz.types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

interface CourseOption {
  id: string;
  name: string;
}

interface QuizFormProps {
  courses: CourseOption[];
  initialData?: QuizDetail;
  onSubmit?: (data: CreateQuizInput) => Promise<void>;
  onAutoSave?: (data: CreateQuizInput) => Promise<void>;
}

type SaveStatus = "idle" | "saving" | "saved";

/**
 * QuizForm - Form for creating or editing quizzes
 * REQ-FE-630: Form with all required fields
 * REQ-FE-633: Validation with CreateQuizSchema
 * REQ-FE-634: Auto-save indicator
 * REQ-FE-635: Warning when editing published quiz
 */
export function QuizForm({
  courses,
  initialData,
  onSubmit,
  onAutoSave,
}: QuizFormProps) {
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditingPublished = initialData?.status === "published";

  const form = useForm<CreateQuizSchemaInput>({
    resolver: zodResolver(CreateQuizSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      courseId: initialData?.courseId ?? "",
      timeLimitMinutes: initialData?.timeLimitMinutes ?? undefined,
      passingScore: initialData?.passingScore ?? undefined,
      allowReattempt: initialData?.allowReattempt ?? false,
      shuffleQuestions: initialData?.shuffleQuestions ?? false,
      showAnswersAfterSubmit: initialData?.showAnswersAfterSubmit ?? false,
      focusLossWarning: initialData?.focusLossWarning ?? false,
      dueDate: initialData?.dueDate ?? undefined,
    },
  });

  // REQ-FE-634: Auto-save with debounce
  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 1500);

  useEffect(() => {
    if (onAutoSave && form.formState.isDirty && form.formState.isValid) {
      setSaveStatus("saving");
      onAutoSave(debouncedValues as CreateQuizInput)
        .then(() => { setSaveStatus("saved"); })
        .catch((error: unknown) => {
          console.error("Auto-save failed:", error);
          setSaveStatus("idle");
        });
    }
  }, [debouncedValues, onAutoSave, form.formState.isDirty, form.formState.isValid]);

  const handleSubmit = async (data: CreateQuizSchemaInput) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data as CreateQuizInput);
      } else {
        // Default behavior: navigate back
        router.back();
      }
    } catch (error) {
      console.error("Failed to save quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* REQ-FE-635: Warning for published quiz */}
      {isEditingPublished && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500 bg-yellow-50 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-800">Warning</h4>
            <p className="text-sm text-yellow-700">
              This quiz is already published. Changes may affect students who have already started the quiz.
            </p>
          </div>
        </div>
      )}

      {/* REQ-FE-634: Auto-save indicator */}
      {saveStatus !== "idle" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-3 w-3 text-green-600" />
              <span className="text-green-600">Saved</span>
            </>
          )}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter quiz title"
                    {...field}
                    aria-required="true"
                  />
                </FormControl>
                <FormDescription>3-200 characters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter quiz description (optional)"
                    rows={3}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>Maximum 1000 characters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Course Selection */}
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Limit */}
          <FormField
            control={form.control}
            name="timeLimitMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Limit (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="No time limit"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>1-300 minutes (leave empty for no limit)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Passing Score */}
          <FormField
            control={form.control}
            name="passingScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passing Score (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="No passing score"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>0-100 (leave empty for no minimum)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                    onChange={(e) => {
                      const value = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>Optional deadline for quiz submission</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Toggle Switches */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">Quiz Settings</h3>

            <FormField
              control={form.control}
              name="allowReattempt"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Allow Reattempt</FormLabel>
                    <FormDescription>
                      Allow students to retake the quiz
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shuffleQuestions"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Shuffle Questions</FormLabel>
                    <FormDescription>
                      Randomize question order for each attempt
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showAnswersAfterSubmit"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Show Answers After Submit</FormLabel>
                    <FormDescription>
                      Show correct answers after quiz submission
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="focusLossWarning"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Focus Loss Warning</FormLabel>
                    <FormDescription>
                      Warn students when they leave the quiz tab
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { router.back(); }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save as Draft
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
