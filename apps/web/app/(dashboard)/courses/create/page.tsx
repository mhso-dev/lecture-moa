/**
 * Course Create Page
 * TASK-032: Course Create Page
 *
 * REQ-FE-420: Create Page Access Control
 * REQ-FE-421: Course Creation Form
 * REQ-FE-424: Successful Creation Redirect
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import { CourseCreateForm } from "~/components/course";
import { Button } from "~/components/ui/button";

/**
 * CourseCreatePage - Page for creating a new course
 *
 * Access control: Only instructors can access this page
 */
export default function CourseCreatePage() {
  const router = useRouter();
  const { role, isLoading, isAuthenticated } = useAuth();

  // Redirect non-instructors to courses list
  useEffect(() => {
    if (!isLoading && isAuthenticated && role !== "instructor") {
      router.push("/courses");
    }
  }, [isLoading, isAuthenticated, role, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-body text-[var(--color-muted-foreground)]">로딩 중...</p>
      </div>
    );
  }

  // Don't render form for non-instructors
  if (role !== "instructor") {
    return null;
  }

  const handleSuccess = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { router.back(); }}
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h1 font-semibold text-foreground">강의 만들기</h1>
          <p className="mt-1 text-body text-[var(--color-muted-foreground)]">
            학생들을 위한 새 강의를 만들어 보세요
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6">
        <CourseCreateForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
