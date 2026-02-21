/**
 * Quiz Results Page
 * REQ-FE-620 to REQ-FE-623: Quiz results display for students
 *
 * Features:
 * - Results summary with score and pass/fail
 * - Question-by-question breakdown
 * - Retake option (if allowed)
 */

import { notFound, redirect } from "next/navigation";
import { getUser } from "~/lib/auth";
import { createClient } from "~/lib/supabase/server";
import { getQuiz, getQuizResult } from "~/lib/supabase/quizzes";
import { ResultsSummary } from "~/components/quiz/quiz-results/results-summary";
import { ResultsBreakdown } from "~/components/quiz/quiz-results/results-breakdown";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface QuizResultsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}

export async function generateMetadata({
  params,
}: QuizResultsPageProps): Promise<Metadata> {
  void await params; // params needed for dynamic route
  return {
    title: `Quiz Results | lecture-moa`,
    description: "View your quiz results and answers.",
  };
}

/**
 * Quiz Results Page
 *
 * Server Component that:
 * 1. Fetches quiz results by attempt ID
 * 2. Displays summary and breakdown
 * 3. Handles access control (own results only)
 *
 * REQ-FE-620: Results Data Fetching
 * REQ-FE-621: Results Summary Card
 * REQ-FE-622: Question-by-Question Review
 */
export default async function QuizResultsPage({
  params,
  searchParams,
}: QuizResultsPageProps) {
  const user = await getUser();

  // Auth protection
  if (!user) {
    redirect("/login");
  }

  // REQ-FE-N605: Instructors view results through instructor routes
  if ((user.user_metadata.role as string) === "instructor") {
    redirect("/instructor/quizzes");
  }

  const { id } = await params;
  const quizId = id;
  const { attemptId } = await searchParams;

  // REQ-FE-620: Attempt ID is required
  if (!attemptId) {
    redirect(`/quizzes/${quizId}`);
  }

  const client = await createClient();

  // Fetch quiz detail
  let quiz;
  try {
    quiz = await getQuiz(quizId, client);
  } catch {
    notFound();
  }

  // Fetch results
  let result;
  try {
    result = await getQuizResult(quizId, attemptId, client);
  } catch {
    // REQ-FE-620: If attemptId doesn't belong to user, redirect
    redirect("/quizzes?error=unauthorized");
  }

  // Check if can retake
  const canRetake = quiz.allowReattempt && quiz.status === "published";

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <Link href="/quizzes">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </Button>
      </Link>

      {/* Results Summary */}
      <ResultsSummary
        result={result}
        quiz={quiz}
        onRetake={canRetake ? () => { /* noop - navigation handled client-side */ } : undefined}
        onBack={() => { /* noop - navigation handled client-side */ }}
        testId="results-summary"
      />

      {/* REQ-FE-622: Question Breakdown */}
      {quiz.showAnswersAfterSubmit && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Question Review</h2>
          <ResultsBreakdown
            results={result.questionResults}
            showAnswers={quiz.showAnswersAfterSubmit}
            testId="results-breakdown"
          />
        </div>
      )}
    </div>
  );
}
