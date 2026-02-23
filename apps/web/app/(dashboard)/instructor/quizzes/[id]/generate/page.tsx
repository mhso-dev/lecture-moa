/**
 * AI Quiz Generation Page
 * REQ-FE-640 to REQ-FE-645: AI-powered question generation
 *
 * Features:
 * - Material selection from course materials
 * - Generation configuration (count, difficulty, types)
 * - Review and accept generated questions
 */

import { notFound, redirect } from "next/navigation";
import { getUser } from "~/lib/auth";
import { createClient } from "~/lib/supabase/server";
import { getQuiz } from "~/lib/supabase/quizzes";
import { QuizGenerateClient } from "./QuizGenerateClient";
import type { Metadata } from "next";

interface QuizGeneratePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: QuizGeneratePageProps): Promise<Metadata> {
  void await params; // params needed for dynamic route
  return {
    title: `퀴즈 문항 생성 | lecture-moa`,
    description: "AI를 사용하여 강의 자료에서 퀴즈 문항을 생성하세요.",
  };
}

/**
 * AI Quiz Generation Page
 *
 * Server Component that provides quiz context to client generator.
 *
 * REQ-FE-640: Material Selection
 * REQ-FE-641: Generation Configuration
 * REQ-FE-642: AI Generation Request
 * REQ-FE-643: Generated Question Review
 */
export default async function QuizGeneratePage({ params }: QuizGeneratePageProps) {
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

  // Mock materials - in production, fetch from materials API
  const mockMaterials = [
    {
      id: "material-1",
      title: "Introduction to Programming",
      courseId: quiz.courseId,
      courseName: quiz.courseName,
      content: "This chapter covers the basics of programming including variables, data types, and control structures...",
    },
    {
      id: "material-2",
      title: "Data Structures Overview",
      courseId: quiz.courseId,
      courseName: quiz.courseName,
      content: "Learn about arrays, linked lists, trees, and graphs in this comprehensive overview...",
    },
  ];

  return (
    <QuizGenerateClient
      quizId={quizId}
      quizTitle={quiz.title}
      materials={mockMaterials}
    />
  );
}
