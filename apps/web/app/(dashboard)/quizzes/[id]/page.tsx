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
import { auth } from "~/lib/auth";
import { fetchQuizDetail, startQuizAttempt } from "~/lib/api/quiz.api";
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
    title: `Take Quiz | lecture-moa`,
    description: "Complete your quiz attempt.",
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
  const session = await auth();

  // Auth protection
  if (!session?.user) {
    redirect("/login");
  }

  // REQ-FE-N605: Instructors cannot take quizzes
  if (session.user.role === "instructor") {
    redirect("/instructor/quizzes");
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

  // REQ-FE-N600: Quiz must be published
  if (quiz.status !== "published") {
    redirect("/quizzes?error=quiz_not_available");
  }

  // REQ-FE-610: Initialize or resume attempt
  let attempt;
  try {
    attempt = await startQuizAttempt(quizId);
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
