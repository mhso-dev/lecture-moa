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
import { createClient } from "~/lib/supabase/server";
import { getQuiz } from "~/lib/supabase/quizzes";
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
    title: `퀴즈 편집 | lecture-moa`,
    description: "퀴즈 설정과 문항을 편집하세요.",
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

  return (
    <QuizEditClient
      quiz={quiz}
      courses={MOCK_COURSES}
    />
  );
}
