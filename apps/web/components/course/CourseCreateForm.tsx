/**
 * CourseCreateForm Component
 * TASK-031: Course Create Form
 *
 * REQ-FE-421: Course Creation Form
 * REQ-FE-422: Form Validation
 * REQ-FE-423: Thumbnail Upload Preview
 * REQ-FE-424: Successful Creation Redirect
 * REQ-FE-425: Creation Error Handling
 */

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateCourse } from "~/hooks/useCreateCourse";
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
  CreateCourseSchema,
  type CreateCourseInput,
} from "@shared";

interface CourseCreateFormProps {
  onSuccess?: (courseId: string) => void;
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
 * CourseCreateForm - Form for creating a new course
 */
export function CourseCreateForm({ onSuccess }: CourseCreateFormProps) {
  const router = useRouter();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateCourse();

  const form = useForm<CreateCourseInput>({
    resolver: zodResolver(CreateCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
      thumbnailUrl: "",
      visibility: "public",
    },
  });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Note: In a real app, you would upload the file and get a URL
      // For now, we'll just use the local preview
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

  const onSubmit = (data: CreateCourseInput) => {
    createMutation.mutate(data, {
      onSuccess: (course) => {
        toast.success("Course created successfully!");
        if (onSuccess) {
          onSuccess(course.id);
        } else {
          router.push(`/courses/${course.id}`);
        }
      },
      onError: (error) => {
        toast.error("Failed to create course. Please try again.");
        console.error("Create course error:", error);
      },
    });
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
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => { router.back(); }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Course
          </Button>
        </div>
      </form>
    </Form>
  );
}
