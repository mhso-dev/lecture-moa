/**
 * QuestionTypeSelector Component
 * REQ-FE-631: Question type selection
 *
 * Features:
 * - Segmented control / radio group for type selection
 * - Options: Multiple Choice, True/False, Short Answer, Fill in the Blank
 */

"use client";

import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import type { QuestionType } from "@shared/types/quiz.types";

interface QuestionTypeSelectorProps {
  value: QuestionType;
  onChange: (type: QuestionType) => void;
  disabled?: boolean;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True/False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "fill_in_the_blank", label: "Fill in the Blank" },
];

/**
 * QuestionTypeSelector - Selector for question type
 */
export function QuestionTypeSelector({
  value,
  onChange,
  disabled = false,
}: QuestionTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Question Type</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => { onChange(v as QuestionType); }}
        disabled={disabled}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {QUESTION_TYPES.map((type) => (
          <div key={type.value} className="flex items-center space-x-2">
            <RadioGroupItem value={type.value} id={`type-${type.value}`} />
            <Label
              htmlFor={`type-${type.value}`}
              className={`cursor-pointer text-sm ${disabled ? "opacity-50" : ""}`}
            >
              {type.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
