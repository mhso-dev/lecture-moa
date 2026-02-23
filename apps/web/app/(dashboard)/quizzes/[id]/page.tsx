/**
 * Quiz Taking Page
 * REQ-FE-610 to REQ-FE-619: Quiz taking interface
 *
 * Features:
 * - Server-side data fetching (quiz detail, attempt initialization)
 * - QuizTakingShell integration
 * - Access control (published status, reattempt check)
 */

import { notFound, redirect } from "next/navigation";
import { getUser } from "~/lib/auth";
import { createClient } from "~/lib/supabase/server";
import { getQuiz, startQuizAttempt } from "~/lib/supabase/quizzes";
import { QuizTakingShell } from "~/components/quiz/quiz-taking/quiz-taking-shell";
import type { Metadata } from "next";

interface QuizTakingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: QuizTakingPageProps): Promise<Metadata> {
  void await params; // params needed for dynamic route
  return {
    title: `퀴즈 응시 | lecture-moa`,
    description: "퀴즈를 완료하세요.",
  };
}

/**
 * Quiz Taking Page
 *
 * Server Component that:
 * 1. Fetches quiz detail
 * 2. Checks for existing in-progress attempt
 * 3. Creates new attempt if needed
 * 4. Passes data to QuizTakingShell client component
 *
 * REQ-FE-610: Quiz Attempt Initialization
 * REQ-FE-N600: No quiz taking on draft/closed quizzes
 * REQ-FE-N605: No instructor quiz taking
 */
export default async function QuizTakingPage({ params }: QuizTakingPageProps) {
  const user = await getUser();

  // Auth protection
  if (!user) {
    redirect("/login");
  }

  // REQ-FE-N605: Instructors cannot take quizzes
  if ((user.user_metadata.role as string) === "instructor") {
    redirect("/instructor/quizzes");
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

  // REQ-FE-N600: Quiz must be published
  if (quiz.status !== "published") {
    redirect("/quizzes?error=quiz_not_available");
  }

  // REQ-FE-610: Initialize or resume attempt
  let attempt;
  try {
    attempt = await startQuizAttempt(quizId, client);
  } catch {
    // If student already submitted and reattempt not allowed
    redirect(`/quizzes/${quizId}/results?error=already_submitted`);
  }

  // If already submitted, redirect to results
  if (attempt.status === "submitted") {
    redirect(`/quizzes/${quizId}/results?attemptId=${attempt.id}`);
  }

  return (
    <QuizTakingShell
      quiz={quiz}
      attempt={attempt}
      onSubmit={() => {
        // Navigation handled by client component
      }}
    />
  );
}
