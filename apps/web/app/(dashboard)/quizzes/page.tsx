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
  title: "Quizzes | lecture-moa",
  description: "View and take quizzes from your enrolled courses.",
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
        <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
        <p className="text-muted-foreground">
          View and take quizzes from your enrolled courses.
        </p>
      </div>

      <QuizList role="student" />
    </div>
  );
}
