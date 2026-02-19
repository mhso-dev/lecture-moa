/**
 * TeamCreationForm Component
 * TASK-020: Team creation form with validation
 * REQ-FE-715, REQ-FE-716: Form fields with React Hook Form + Zod validation
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTeamSchema, type CreateTeamSchema as CreateTeamType } from "@shared/validators";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface TeamCreationFormProps {
  onSubmit: (data: CreateTeamType) => void;
  isSubmitting: boolean;
  courses?: Array<{ id: string; name: string }>;
}

/**
 * TeamCreationForm provides a form for creating new teams
 * with validation using CreateTeamSchema
 */
export function TeamCreationForm({
  onSubmit,
  isSubmitting,
  courses = [],
}: TeamCreationFormProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [descriptionLength, setDescriptionLength] = useState(0);

  const form = useForm<CreateTeamType>({
    resolver: zodResolver(CreateTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      maxMembers: 10,
      courseIds: [],
    },
  });

  const handleSubmit = (data: CreateTeamType) => {
    // Include selected courses in submission
    onSubmit({
      ...data,
      courseIds: selectedCourses,
    });
  };

  const handleDescriptionChange = (value: string) => {
    setDescriptionLength(value.length);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        data-testid="team-creation-form"
        className="space-y-6"
      >
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter team name"
                  maxLength={50}
                  data-testid="name-input"
                />
              </FormControl>
              <FormDescription>
                Team name must be 2-50 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe your team's purpose and goals..."
                  maxLength={500}
                  className="min-h-[100px]"
                  data-testid="description-input"
                  onChange={(e) => {
                    field.onChange(e);
                    handleDescriptionChange(e.target.value);
                  }}
                />
              </FormControl>
              <div className="flex justify-between">
                <FormMessage />
                <span
                  className="text-xs text-muted-foreground"
                  data-testid="char-count"
                >
                  {descriptionLength}/500
                </span>
              </div>
            </FormItem>
          )}
        />

        {/* Max Members Field */}
        <FormField
          control={form.control}
          name="maxMembers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Members *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={2}
                  max={100}
                  data-testid="max-members-input"
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormDescription>
                Team can have 2-100 members.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Course Association Field */}
        {courses.length > 0 && (
          <FormField
            control={form.control}
            name="courseIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Association (optional)</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      const newSelection = selectedCourses.includes(value)
                        ? selectedCourses.filter((id) => id !== value)
                        : [...selectedCourses, value];
                      setSelectedCourses(newSelection);
                      field.onChange(newSelection);
                    }}
                  >
                    <SelectTrigger data-testid="courses-input">
                      <SelectValue placeholder="Select associated courses" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  Link this team to specific courses.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Selected Courses Display */}
        {selectedCourses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCourses.map((courseId) => {
              const course = courses.find((c) => c.id === courseId);
              return (
                <Button
                  key={courseId}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCourses(
                      selectedCourses.filter((id) => id !== courseId)
                    );
                  }}
                >
                  {course?.name || courseId}
                  <span className="ml-2">&times;</span>
                </Button>
              );
            })}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="submit-button"
          >
            {isSubmitting ? "Creating..." : "Create Team"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/teams" data-testid="cancel-link">
              Cancel
            </a>
          </Button>
        </div>
      </form>
    </Form>
  );
}
