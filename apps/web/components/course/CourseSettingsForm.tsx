/**
 * CourseSettingsForm Component
 * TASK-033: Course Settings Form
 *
 * REQ-FE-431: Edit Course Information
 * REQ-FE-432: Save Settings
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useUpdateCourse } from "~/hooks/useUpdateCourse";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
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
import {
  UpdateCourseSchema,
  type UpdateCourseInput,
  type Course,
} from "@shared";

interface CourseSettingsFormProps {
  courseId: string;
  defaultValues: Course;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "programming", label: "Programming" },
  { value: "design", label: "Design" },
  { value: "business", label: "Business" },
  { value: "science", label: "Science" },
  { value: "language", label: "Language" },
  { value: "other", label: "Other" },
];

/**
 * CourseSettingsForm - Form for editing course settings
 */
export function CourseSettingsForm({
  courseId,
  defaultValues,
  onSuccess,
}: CourseSettingsFormProps) {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    defaultValues.thumbnailUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useUpdateCourse();

  const form = useForm<UpdateCourseInput>({
    resolver: zodResolver(UpdateCourseSchema),
    defaultValues: {
      title: defaultValues.title,
      description: defaultValues.description,
      category: defaultValues.category,
      thumbnailUrl: defaultValues.thumbnailUrl || "",
      visibility: defaultValues.visibility,
      status: defaultValues.status,
    },
  });

  // Update form when defaultValues change
  useEffect(() => {
    form.reset({
      title: defaultValues.title,
      description: defaultValues.description,
      category: defaultValues.category,
      thumbnailUrl: defaultValues.thumbnailUrl || "",
      visibility: defaultValues.visibility,
      status: defaultValues.status,
    });
    setThumbnailPreview(defaultValues.thumbnailUrl || null);
  }, [defaultValues, form]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("thumbnailUrl", URL.createObjectURL(file));
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null);
    form.setValue("thumbnailUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: UpdateCourseInput) => {
    updateMutation.mutate(
      { courseId, ...data },
      {
        onSuccess: () => {
          toast.success("Course updated successfully");
          onSuccess?.();
        },
        onError: (error) => {
          toast.error("Failed to update course. Please try again.");
          console.error("Update course error:", error);
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter course title"
                  {...field}
                  aria-required="true"
                />
              </FormControl>
              <FormDescription>
                3-100 characters
              </FormDescription>
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
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your course"
                  rows={4}
                  {...field}
                  aria-required="true"
                />
              </FormControl>
              <FormDescription>
                10-2000 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Thumbnail */}
        <FormField
          control={form.control}
          name="thumbnailUrl"
          render={() => (
            <FormItem>
              <FormLabel>Thumbnail</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {thumbnailPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="h-40 w-64 rounded-lg object-cover border border-[var(--color-border)]"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveThumbnail}
                        aria-label="Remove thumbnail"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="thumbnail-upload"
                      className="flex flex-col items-center justify-center h-40 w-64 border-2 border-dashed border-[var(--color-border)] rounded-lg cursor-pointer hover:bg-[var(--color-muted)]"
                    >
                      <Upload className="h-8 w-8 text-[var(--color-muted-foreground)] mb-2" />
                      <span className="text-sm text-[var(--color-muted-foreground)]">
                        Upload thumbnail
                      </span>
                      <input
                        id="thumbnail-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailChange}
                        aria-label="Thumbnail"
                      />
                    </label>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Visibility */}
        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="public" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Public
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="invite_only" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Invite Only
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Public courses can be discovered by all users. Invite-only courses require an invite code.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
