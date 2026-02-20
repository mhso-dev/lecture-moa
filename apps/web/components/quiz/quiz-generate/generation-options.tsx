/**
 * GenerationOptions Component
 * REQ-FE-641: AI generation options configuration
 *
 * Features:
 * - Material selection (uses MaterialSelector)
 * - Question count (1-50, default 10)
 * - Difficulty (easy/medium/hard segmented)
 * - Question types (multi-checkbox)
 */

"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Checkbox } from "~/components/ui/checkbox";
import type { GenerationOptions as GenerationOptionsType, QuestionType } from "@shared/types/quiz.types";
import { MaterialSelector } from "./material-selector";

interface Material {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  content: string;
}

interface GenerationOptionsProps {
  options: GenerationOptionsType;
  onChange: (options: GenerationOptionsType) => void;
  materials: Material[];
}

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "fill_in_the_blank", label: "Fill in the Blank" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

/**
 * GenerationOptions - Form for AI quiz generation options
 * REQ-FE-641: Configures material selection, count, difficulty, and types
 */
export function GenerationOptions({
  options,
  onChange,
  materials,
}: GenerationOptionsProps) {
  const handleMaterialChange = (materialIds: string[]) => {
    onChange({ ...options, materialIds });
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 50) {
      onChange({ ...options, count: value });
    }
  };

  const handleDifficultyChange = (difficulty: string) => {
    onChange({ ...options, difficulty: difficulty as "easy" | "medium" | "hard" });
  };

  const handleQuestionTypeToggle = (type: QuestionType) => {
    const newTypes = options.questionTypes.includes(type)
      ? options.questionTypes.filter((t) => t !== type)
      : [...options.questionTypes, type];

    if (newTypes.length > 0) {
      onChange({ ...options, questionTypes: newTypes });
    }
  };

  return (
    <div className="space-y-6">
      {/* Material Selection */}
      <div>
        <MaterialSelector
          materials={materials}
          selectedIds={options.materialIds}
          onChange={handleMaterialChange}
        />
      </div>

      {/* Question Count */}
      <div className="space-y-2">
        <Label htmlFor="question-count">Number of Questions</Label>
        <Input
          id="question-count"
          type="number"
          value={options.count}
          onChange={handleCountChange}
          min={1}
          max={50}
          className="w-32"
        />
        <p className="text-sm text-muted-foreground">
          Generate between 1 and 50 questions
        </p>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <Label>Difficulty</Label>
        <RadioGroup
          value={options.difficulty}
          onValueChange={handleDifficultyChange}
          className="flex gap-4"
        >
          {DIFFICULTY_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-2">
              <RadioGroupItem value={opt.value} id={`difficulty-${opt.value}`} />
              <Label htmlFor={`difficulty-${opt.value}`} className="cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Question Types */}
      <div className="space-y-2">
        <Label>Question Types</Label>
        <p className="text-sm text-muted-foreground">
          Select at least one question type
        </p>
        <div className="grid grid-cols-2 gap-3">
          {QUESTION_TYPE_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${opt.value}`}
                checked={options.questionTypes.includes(opt.value)}
                onCheckedChange={() => { handleQuestionTypeToggle(opt.value); }}
              />
              <Label htmlFor={`type-${opt.value}`} className="cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
