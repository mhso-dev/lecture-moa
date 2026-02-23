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
import { createClient } from "~/lib/supabase/server";
import { getQuiz, getSubmissions } from "~/lib/supabase/quizzes";
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
    title: `퀴즈 제출 현황 | lecture-moa`,
    description: "이 퀴즈의 모든 학생 제출 현황을 확인하세요.",
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

  const client = await createClient();

  // Fetch quiz detail
  let quiz;
  try {
    quiz = await getQuiz(quizId, client);
  } catch {
    notFound();
  }

  // Fetch submissions
  let submissions: Awaited<ReturnType<typeof getSubmissions>> = [];
  try {
    submissions = await getSubmissions(quizId, client);
  } catch {
    // Handle error silently, show empty state
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link href="/instructor/quizzes">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          퀴즈 관리로
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          제출 현황: {quiz.title}
        </h1>
        <p className="text-muted-foreground">
          이 퀴즈의 모든 학생 제출 현황을 확인하세요.
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
