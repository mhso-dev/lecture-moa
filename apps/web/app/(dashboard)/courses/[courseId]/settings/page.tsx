/**
 * Course Settings Page
 * TASK-034: Course Settings Page
 *
 * REQ-FE-430: Settings Page Access Control
 * REQ-FE-431: Edit Course Information
 * REQ-FE-432: Save Settings
 * REQ-FE-433: Invite Code Management
 * REQ-FE-435: Remove Student
 * REQ-FE-436: Archive Course
 * REQ-FE-437: Delete Course
 */

"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "~/hooks/useAuth";
import { ArrowLeft, Settings, Users, KeyRound } from "lucide-react";
import { useCourse } from "~/hooks/useCourse";
import {
  CourseSettingsForm,
  CourseInviteCode,
  CourseStudentRoster,
  CourseDangerZone,
} from "~/components/course";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

/**
 * CourseSettingsPage - Page for managing course settings
 *
 * Access control: Only the course owner (instructor) can access this page
 */
export default function CourseSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const { data: course, isLoading, error } = useCourse(courseId);

  // Redirect non-owners to course detail
  useEffect(() => {
    if (
      isAuthenticated &&
      course &&
      course.instructor.id !== user?.id
    ) {
      router.push(`/courses/${courseId}`);
    }
  }, [course, user, isAuthenticated, router, courseId]);

  // Show loading state
  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Show error state
  if (error || !course) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-body text-[var(--color-muted-foreground)]">
          강의를 찾을 수 없거나 접근 권한이 없습니다.
        </p>
      </div>
    );
  }

  // Don't render for non-owners
  if (course.instructor.id !== user?.id) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { router.push(`/courses/${courseId}`); }}
          aria-label="강의로 돌아가기"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h1 font-semibold text-foreground">
            강의 설정
          </h1>
          <p className="mt-1 text-body text-[var(--color-muted-foreground)]">
            강의 설정 및 학생을 관리하세요
          </p>
        </div>
      </div>

      {/* Course Information Section */}
      <section className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          <h2 className="text-lg font-semibold">강의 정보</h2>
        </div>
        <CourseSettingsForm courseId={courseId} defaultValues={course} />
      </section>

      {/* Invite Code Section (for invite_only courses) */}
      {course.visibility === "invite_only" && (
        <section className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="h-5 w-5 text-[var(--color-muted-foreground)]" />
            <h2 className="text-lg font-semibold">초대 코드</h2>
          </div>
          <CourseInviteCode
            courseId={courseId}
            code={course.inviteCode}
          />
        </section>
      )}

      {/* Student Roster Section */}
      <section className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          <h2 className="text-lg font-semibold">수강생 목록</h2>
        </div>
        <CourseStudentRoster courseId={courseId} />
      </section>

      {/* Danger Zone Section */}
      <section>
        <CourseDangerZone
          courseId={courseId}
          courseTitle={course.title}
          onArchive={() => { router.push("/courses"); }}
          onDelete={() => { router.push("/courses"); }}
        />
      </section>
    </div>
  );
}
