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
    title: `강의 퀴즈 | lecture-moa`,
    description: "이 강의의 퀴즈를 확인하세요.",
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
  if ((user.user_metadata.role as string) === "instructor") {
    redirect("/instructor/quizzes");
  }

  const { courseId: _courseId } = await params;

  // The QuizList component handles filtering by courseId
  // through the useInfiniteQuery hook
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">강의 퀴즈</h1>
        <p className="text-muted-foreground">
          이 강의의 퀴즈를 확인하고 풀어보세요.
        </p>
      </div>

      <QuizList role="student" />
    </div>
  );
}
