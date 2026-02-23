/**
 * Student Quiz List Page
 * REQ-FE-602 to REQ-FE-607: Quiz list for students
 *
 * Features:
 * - Student quiz list with filters
 * - Role-based view (student only)
 * - Auth protection via auth()
 */

import { redirect } from "next/navigation";
import { getUser } from "~/lib/auth";
import { QuizList } from "~/components/quiz/quiz-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "퀴즈 | lecture-moa",
  description: "수강 중인 강의의 퀴즈를 확인하고 응시하세요.",
};

/**
 * Student Quiz List Page
 *
 * Displays quizzes for enrolled courses with filtering options.
 * Protected route - only accessible to students.
 */
export default async function StudentQuizzesPage() {
  const user = await getUser();

  // Auth protection
  if (!user) {
    redirect("/login");
  }

  // REQ-FE-N605: Instructors should not access student quiz taking routes
  if ((user.user_metadata.role as string) === "instructor") {
    redirect("/instructor/quizzes");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">퀴즈</h1>
        <p className="text-muted-foreground">
          수강 중인 강의의 퀴즈를 확인하고 응시하세요.
        </p>
      </div>

      <QuizList role="student" />
    </div>
  );
}
