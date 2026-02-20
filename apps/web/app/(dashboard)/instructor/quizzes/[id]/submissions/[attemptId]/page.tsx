/**
 * Instructor Student Results View
 * REQ-FE-624: Instructor view of student quiz results
 *
 * Features:
 * - Student result details with score breakdown
 * - Previous/next student navigation
 * - Student info panel
 */

import { notFound, redirect } from "next/navigation";
import { auth } from "~/lib/auth";
import { fetchQuizDetail, fetchQuizResult, fetchSubmissions } from "~/lib/api/quiz.api";
import { ResultsSummary } from "~/components/quiz/quiz-results/results-summary";
import { ResultsBreakdown } from "~/components/quiz/quiz-results/results-breakdown";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface InstructorResultPageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export async function generateMetadata({
  params,
}: InstructorResultPageProps): Promise<Metadata> {
  void await params; // params needed for dynamic route
  return {
    title: `Student Results | lecture-moa`,
    description: "View student quiz submission details.",
  };
}

/**
 * Instructor Student Results Page
 *
 * Server Component showing a student's quiz results from instructor perspective.
 *
 * REQ-FE-624: Results Sharing (Instructor View)
 */
export default async function InstructorResultPage({ params }: InstructorResultPageProps) {
  const session = await auth();

  // Auth protection
  if (!session?.user) {
    redirect("/login");
  }

  // Role protection - instructors only
  if (session.user.role !== "instructor") {
    redirect("/quizzes");
  }

  const { id, attemptId } = await params;
  const quizId = id;

  // Fetch quiz detail
  let quiz;
  try {
    quiz = await fetchQuizDetail(quizId);
  } catch {
    notFound();
  }

  // Fetch result
  let result;
  try {
    result = await fetchQuizResult(quizId, attemptId);
  } catch {
    notFound();
  }

  // Fetch all submissions for navigation
  let submissions: Awaited<ReturnType<typeof fetchSubmissions>> = [];
  try {
    submissions = await fetchSubmissions(quizId);
  } catch {
    // Handle error silently
  }

  // Find current submission index and neighbors
  const currentIndex = submissions.findIndex((s) => s.attemptId === attemptId);
  const prevSubmission = currentIndex > 0 ? submissions[currentIndex - 1] : null;
  const nextSubmission = currentIndex < submissions.length - 1 ? submissions[currentIndex + 1] : null;
  const currentSubmission = submissions[currentIndex];

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link href={`/instructor/quizzes/${quizId}/submissions`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Results: {quiz.title}
            </h1>
            <p className="text-muted-foreground">
              Student submission details
            </p>
          </div>

          {/* Results Summary */}
          <ResultsSummary
            result={result}
            quiz={quiz}
            testId="instructor-results-summary"
          />

          {/* Question Breakdown - Instructors always see answers */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Question Review</h2>
            <ResultsBreakdown
              results={result.questionResults}
              showAnswers={true}
              testId="instructor-results-breakdown"
            />
          </div>
        </div>

        {/* Student info and navigation sidebar */}
        <div className="space-y-6">
          {/* Student Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">
                  {currentSubmission?.userName ?? "Unknown"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Submitted</div>
                <div className="font-medium">
                  {currentSubmission?.submittedAt
                    ? new Date(currentSubmission.submittedAt).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation between students */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigate Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {prevSubmission ? (
                  <Link
                    href={`/instructor/quizzes/${quizId}/submissions/${prevSubmission.attemptId}`}
                  >
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                )}

                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {submissions.length}
                </span>

                {nextSubmission ? (
                  <Link
                    href={`/instructor/quizzes/${quizId}/submissions/${nextSubmission.attemptId}`}
                  >
                    <Button variant="outline" size="sm">
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
