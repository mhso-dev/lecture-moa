/**
 * Quiz Submissions List Page
 * REQ-FE-651: Student submissions view for instructors
 *
 * Features:
 * - List of all student submissions
 * - Score and pass/fail status
 * - Export CSV functionality
 */

import { notFound, redirect } from "next/navigation";
import { getUser } from "~/lib/auth";
import { fetchQuizDetail, fetchSubmissions } from "~/lib/api/quiz.api";
import { SubmissionList } from "~/components/quiz/quiz-manage/submission-list";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface QuizSubmissionsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: QuizSubmissionsPageProps): Promise<Metadata> {
  void await params; // params needed for dynamic route
  return {
    title: `Quiz Submissions | lecture-moa`,
    description: "View all student submissions for this quiz.",
  };
}

/**
 * Quiz Submissions List Page
 *
 * Server Component that fetches submissions and renders list.
 *
 * REQ-FE-651: Submissions View
 */
export default async function QuizSubmissionsPage({ params }: QuizSubmissionsPageProps) {
  const user = await getUser();

  // Auth protection
  if (!user) {
    redirect("/login");
  }

  // Role protection - instructors only
  if ((user.user_metadata.role as string) !== "instructor") {
    redirect("/quizzes");
  }

  const { id } = await params;
  const quizId = id;

  // Fetch quiz detail
  let quiz;
  try {
    quiz = await fetchQuizDetail(quizId);
  } catch {
    notFound();
  }

  // Fetch submissions
  let submissions: Awaited<ReturnType<typeof fetchSubmissions>> = [];
  try {
    submissions = await fetchSubmissions(quizId);
  } catch {
    // Handle error silently, show empty state
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link href="/instructor/quizzes">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quiz Management
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Submissions: {quiz.title}
        </h1>
        <p className="text-muted-foreground">
          View all student submissions for this quiz.
        </p>
      </div>

      <SubmissionList
        submissions={submissions}
        passingScore={quiz.passingScore ?? undefined}
        testId="submission-list"
      />
    </div>
  );
}
