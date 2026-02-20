/**
 * Quiz Edit Page
 * REQ-FE-635: Quiz editing for instructors
 *
 * Features:
 * - QuizForm pre-populated with existing quiz data
 * - Warning when editing published quiz
 * - Auto-save for changes
 */

import { notFound, redirect } from "next/navigation";
import { getUser } from "~/lib/auth";
import { fetchQuizDetail } from "~/lib/api/quiz.api";
import { QuizEditClient } from "./QuizEditClient";
import type { Metadata } from "next";

interface QuizEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: QuizEditPageProps): Promise<Metadata> {
  void await params; // params needed for dynamic route
  return {
    title: `Edit Quiz | lecture-moa`,
    description: "Edit your quiz settings and questions.",
  };
}

// Mock course options - in production, this would be fetched from the API
const MOCK_COURSES = [
  { id: "course-1", name: "Introduction to Computer Science" },
  { id: "course-2", name: "Advanced Mathematics" },
  { id: "course-3", name: "Physics 101" },
];

/**
 * Quiz Edit Page
 *
 * Server Component that fetches quiz data and passes to client form.
 *
 * REQ-FE-635: Quiz Edit Page
 */
export default async function QuizEditPage({ params }: QuizEditPageProps) {
  const user = await getUser();

  // Auth protection
  if (!user) {
    redirect("/login");
  }

  // Role protection - instructors only
  if ((user.user_metadata?.role as string) !== "instructor") {
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

  return (
    <QuizEditClient
      quiz={quiz}
      courses={MOCK_COURSES}
    />
  );
}
