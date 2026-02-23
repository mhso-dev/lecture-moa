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
  courses?: { id: string; name: string }[];
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
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined);
  const [descriptionLength, setDescriptionLength] = useState(0);

  const form = useForm<CreateTeamType>({
    resolver: zodResolver(CreateTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      maxMembers: 10,
      courseId: undefined,
    },
  });

  const handleSubmit = (data: CreateTeamType) => {
    // Include selected course in submission
    onSubmit({
      ...data,
      courseId: selectedCourseId,
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
              <FormLabel>이름 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="팀 이름을 입력하세요"
                  maxLength={50}
                  data-testid="name-input"
                />
              </FormControl>
              <FormDescription>
                팀 이름은 2~50자여야 합니다.
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
              <FormLabel>설명 (선택사항)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="팀의 목적과 목표를 설명하세요..."
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
              <FormLabel>최대 인원 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={2}
                  max={100}
                  data-testid="max-members-input"
                  onChange={(e) => { field.onChange(parseInt(e.target.value, 10)); }}
                />
              </FormControl>
              <FormDescription>
                팀 인원은 2~100명까지 설정할 수 있습니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Course Association Field */}
        {courses.length > 0 && (
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>강의 연결 (선택사항)</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      setSelectedCourseId(value);
                      field.onChange(value);
                    }}
                    value={selectedCourseId}
                  >
                    <SelectTrigger data-testid="course-input">
                      <SelectValue placeholder="연결할 강의를 선택하세요" />
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
                  이 팀을 강의에 연결합니다.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Form Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="submit-button"
          >
            {isSubmitting ? "생성 중..." : "팀 만들기"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/teams" data-testid="cancel-link">
              취소
            </a>
          </Button>
        </div>
      </form>
    </Form>
  );
}
