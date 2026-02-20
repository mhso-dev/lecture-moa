/**
 * Instructor Quiz Management Page
 * REQ-FE-650 to REQ-FE-655: Quiz management for instructors
 *
 * Features:
 * - Quiz management table with all instructor quizzes
 * - Role protection (instructor only)
 * - Actions: edit, manage submissions, duplicate, delete
 */

import { redirect } from "next/navigation";
import { auth } from "~/lib/auth";
import { QuizManageTable } from "~/components/quiz/quiz-manage/quiz-manage-table";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Management | lecture-moa",
  description: "Manage your quizzes, view submissions, and track student performance.",
};

/**
 * Instructor Quiz Management Page
 *
 * Displays management table with all instructor's quizzes.
 * Protected route - only accessible to instructors.
 *
 * REQ-FE-650: Quiz Management Table
 * REQ-FE-N602: No student access to instructor routes
 */
export default async function InstructorQuizzesPage() {
  const session = await auth();

  // Auth protection
  if (!session?.user) {
    redirect("/login");
  }

  // REQ-FE-N602: Role protection - instructors only
  if (session.user.role !== "instructor") {
    redirect("/quizzes");
  }

  // The QuizManageTable component will handle fetching quizzes
  // through its own data fetching hook
  const mockQuizzes: never[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz Management</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage your quizzes.
          </p>
        </div>

        <Link href="/instructor/quizzes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </Link>
      </div>

      <QuizManageTable
        quizzes={mockQuizzes}
        onCreateNew={() => { /* noop */ }}
        testId="instructor-quiz-table"
      />
    </div>
  );
}
