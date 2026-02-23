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
import { getUser } from "~/lib/auth";
import { QuizManageTable } from "~/components/quiz/quiz-manage/quiz-manage-table";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "퀴즈 관리 | lecture-moa",
  description: "퀴즈를 관리하고, 제출 현황을 확인하고, 학생 성적을 추적하세요.",
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
  const user = await getUser();

  // Auth protection
  if (!user) {
    redirect("/login");
  }

  // REQ-FE-N602: Role protection - instructors only
  if ((user.user_metadata.role as string) !== "instructor") {
    redirect("/quizzes");
  }

  // The QuizManageTable component will handle fetching quizzes
  // through its own data fetching hook
  const mockQuizzes: never[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">퀴즈 관리</h1>
          <p className="text-muted-foreground">
            퀴즈를 생성, 편집, 관리하세요.
          </p>
        </div>

        <Link href="/instructor/quizzes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            퀴즈 만들기
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
