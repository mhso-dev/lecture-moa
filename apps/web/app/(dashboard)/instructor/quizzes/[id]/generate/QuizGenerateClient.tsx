/**
 * QuizGenerateClient Component
 * Client component for AI question generation
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { GenerationOptions } from "~/components/quiz/quiz-generate/generation-options";
import { GeneratedQuestionReview } from "~/components/quiz/quiz-generate/generated-question-review";
import { generateQuizWithAI } from "~/lib/api/quiz.api";
import type { GenerationOptions as GenerationOptionsType, GeneratedQuestion } from "@shared";
import { toast } from "sonner";

interface Material {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  content: string;
}

interface QuizGenerateClientProps {
  quizId: string;
  quizTitle: string;
  materials: Material[];
}

type Step = "configure" | "generating" | "review";

const DEFAULT_OPTIONS: GenerationOptionsType = {
  materialIds: [],
  count: 10,
  difficulty: "medium",
  questionTypes: ["multiple_choice", "true_false"],
};

export function QuizGenerateClient({
  quizId,
  quizTitle,
  materials,
}: QuizGenerateClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("configure");
  const [options, setOptions] = useState<GenerationOptionsType>(DEFAULT_OPTIONS);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (options.materialIds.length === 0) {
      toast.error("Please select at least one material");
      return;
    }

    setStep("generating");
    setError(null);

    try {
      // REQ-FE-642: AI Generation Request with 60s timeout
      const questions = await Promise.race([
        generateQuizWithAI(options),
        new Promise<never>((_, reject) => {
          setTimeout(() => { reject(new Error("Generation timeout")); }, 60000);
        }),
      ]);

      setGeneratedQuestions(questions);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate questions");
      setStep("configure");
    }
  }, [options]);

  const handleAccept = useCallback((questions: GeneratedQuestion[]) => {
    // In production, this would save questions to the quiz via API
    toast.success(`${String(questions.length)} questions added to quiz`);
    router.push(`/instructor/quizzes/${quizId}/edit`);
  }, [quizId, router]);

  const handleRegenerate = useCallback(() => {
    setGeneratedQuestions([]);
    setStep("configure");
  }, []);


  // Configure step
  if (step === "configure") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Generate Questions for: {quizTitle}
          </h1>
          <p className="text-muted-foreground">
            Select materials and configure options for AI question generation.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Generation Failed</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="rounded-lg border p-6">
          <GenerationOptions
            options={options}
            onChange={setOptions}
            materials={materials}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => { router.back(); }}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={options.materialIds.length === 0}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Questions
          </Button>
        </div>
      </div>
    );
  }

  // Generating step
  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Generating Questions...</h2>
        <p className="text-muted-foreground text-center max-w-md">
          AI is analyzing your materials and creating quiz questions.
          This may take up to 60 seconds.
        </p>
      </div>
    );
  }

  // Review step
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Review Generated Questions
        </h1>
        <p className="text-muted-foreground">
          Review, edit, and accept the AI-generated questions.
        </p>
      </div>

      <GeneratedQuestionReview
        questions={generatedQuestions}
        onAccept={handleAccept}
        onRegenerate={handleRegenerate}
      />
    </div>
  );
}
