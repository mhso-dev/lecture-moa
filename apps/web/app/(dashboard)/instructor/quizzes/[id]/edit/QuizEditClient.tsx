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
      toast.success("퀴즈가 업데이트되었습니다");
      router.push("/instructor/quizzes");
    } catch (error) {
      toast.error("퀴즈 업데이트에 실패했습니다");
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
        <h1 className="text-2xl font-bold tracking-tight">퀴즈 편집</h1>
        <p className="text-muted-foreground">
          퀴즈 설정과 문항을 수정하세요.
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
            <h2 className="text-lg font-semibold">AI로 문항 생성</h2>
            <p className="text-sm text-muted-foreground">
              AI를 사용하여 강의 자료에서 자동으로 퀴즈 문항을 생성하세요.
            </p>
          </div>
          <a
            href={`/instructor/quizzes/${quiz.id}/generate`}
            className="text-primary hover:underline"
          >
            문항 생성
          </a>
        </div>
      </div>
    </div>
  );
}
