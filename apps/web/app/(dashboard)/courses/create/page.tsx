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
import { useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();

  // Redirect non-instructors to courses list
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "instructor") {
      router.push("/courses");
    }
  }, [session, status, router]);

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-body text-[var(--color-muted-foreground)]">Loading...</p>
      </div>
    );
  }

  // Don't render form for non-instructors
  if (session?.user?.role !== "instructor") {
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
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h1 font-semibold text-foreground">Create Course</h1>
          <p className="mt-1 text-body text-[var(--color-muted-foreground)]">
            Create a new course for your students
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
