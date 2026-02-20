/**
 * Quiz Creation Page
 * REQ-FE-630 to REQ-FE-636: Quiz creation form for instructors
 *
 * Features:
 * - QuizForm for new quiz metadata
 * - Auto-save indicator
 * - Course selection dropdown
 */

"use client";

import { useRouter } from "next/navigation";
import { QuizForm } from "~/components/quiz/quiz-create/quiz-form";
import { createQuiz } from "~/lib/api/quiz.api";
import type { CreateQuizInput } from "@shared";
import { toast } from "sonner";

// Mock course options - in production, this would be fetched from the API
const MOCK_COURSES = [
  { id: "course-1", name: "Introduction to Computer Science" },
  { id: "course-2", name: "Advanced Mathematics" },
  { id: "course-3", name: "Physics 101" },
];

/**
 * Quiz Creation Page
 *
 * Client Component with QuizForm for creating new quizzes.
 *
 * REQ-FE-630: Quiz Metadata Form
 * REQ-FE-633: Quiz Form Auto-Save
 */
export default function QuizCreatePage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateQuizInput) => {
    try {
      const quiz = await createQuiz(data);
      toast.success("Quiz created successfully");
      router.push(`/instructor/quizzes/${quiz.id}/edit`);
    } catch (error) {
      toast.error("Failed to create quiz");
      console.error("Failed to create quiz:", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  const handleAutoSave = async (data: CreateQuizInput) => {
    // Auto-save logic would create/update draft
    console.log("Auto-saving quiz draft:", data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Quiz</h1>
        <p className="text-muted-foreground">
          Set up a new quiz for your students.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <QuizForm
          courses={MOCK_COURSES}
          onSubmit={handleSubmit}
          onAutoSave={handleAutoSave}
        />
      </div>
    </div>
  );
}
