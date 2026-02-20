/**
 * Course Quiz List Page
 * REQ-FE-602, REQ-FE-603: Course-filtered quiz list
 *
 * Features:
 * - Quizzes filtered by course
 * - Student view for enrolled courses
 */

import { redirect } from "next/navigation";
import { getUser } from "~/lib/auth";
import { QuizList } from "~/components/quiz/quiz-list";
import type { Metadata } from "next";

interface CourseQuizzesPageProps {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({
  params,
}: CourseQuizzesPageProps): Promise<Metadata> {
  const { courseId: _courseId } = await params;
  return {
    title: `Course Quizzes | lecture-moa`,
    description: "View quizzes for this course.",
  };
}

/**
 * Course Quiz List Page
 *
 * Displays quizzes filtered by course ID.
 * Protected route - only accessible to authenticated users.
 */
export default async function CourseQuizzesPage({
  params,
}: CourseQuizzesPageProps) {
  const user = await getUser();

  // Auth protection
  if (!user) {
    redirect("/login");
  }

  // Instructors should use their management view
  if ((user.user_metadata?.role as string) === "instructor") {
    redirect("/instructor/quizzes");
  }

  const { courseId: _courseId } = await params;

  // The QuizList component handles filtering by courseId
  // through the useInfiniteQuery hook
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Course Quizzes</h1>
        <p className="text-muted-foreground">
          View and take quizzes from this course.
        </p>
      </div>

      <QuizList role="student" />
    </div>
  );
}
