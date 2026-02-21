/**
 * QuizEditClient Component
 * Client component for quiz editing
 */

"use client";

import { useRouter } from "next/navigation";
import { QuizForm } from "~/components/quiz/quiz-create/quiz-form";
import { updateQuiz, type UpdateQuizPayload } from "~/lib/supabase/quizzes";
import type { QuizDetail, CreateQuizInput } from "@shared";
import { toast } from "sonner";

interface QuizEditClientProps {
  quiz: QuizDetail;
  courses: { id: string; name: string }[];
}

export function QuizEditClient({ quiz, courses }: QuizEditClientProps) {
  const router = useRouter();

  const handleSubmit = async (data: CreateQuizInput) => {
    try {
      await updateQuiz(quiz.id, data as unknown as UpdateQuizPayload);
      toast.success("Quiz updated successfully");
      router.push("/instructor/quizzes");
    } catch (error) {
      toast.error("Failed to update quiz");
      console.error("Failed to update quiz:", error);
    }
  };

  const handleAutoSave = async (data: CreateQuizInput) => {
    try {
      await updateQuiz(quiz.id, data as unknown as UpdateQuizPayload);
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Quiz</h1>
        <p className="text-muted-foreground">
          Update quiz settings and questions.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <QuizForm
          courses={courses}
          initialData={quiz}
          onSubmit={handleSubmit}
          onAutoSave={handleAutoSave}
        />
      </div>

      {/* AI Generation Link */}
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Generate Questions with AI</h2>
            <p className="text-sm text-muted-foreground">
              Use AI to automatically generate quiz questions from course materials.
            </p>
          </div>
          <a
            href={`/instructor/quizzes/${quiz.id}/generate`}
            className="text-primary hover:underline"
          >
            Generate Questions
          </a>
        </div>
      </div>
    </div>
  );
}
