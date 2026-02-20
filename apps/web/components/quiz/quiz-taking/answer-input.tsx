/**
 * AnswerInput Component
 * REQ-FE-612: Question Display - Answer Input Variants
 *
 * Renders appropriate input UI based on question type
 */

"use client";

import * as React from "react";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import type {
  Question,
  DraftAnswer,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  FillInBlankQuestion,
  MultipleChoiceDraftAnswer,
  TrueFalseDraftAnswer,
  ShortAnswerDraftAnswer,
  FillInBlankDraftAnswer,
} from "@shared";

// ============================================================================
// Types
// ============================================================================

export interface AnswerInputProps {
  /** The question to display input for */
  question: Question;
  /** Current answer (if any) */
  answer?: DraftAnswer;
  /** Callback when answer changes */
  onChange: (answer: DraftAnswer) => void;
  /** Custom className */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate option labels (A, B, C, D, E, F, G, H, I)
 */
function getOptionLabel(index: number): string {
  return String.fromCharCode(65 + index); // A=65
}

// ============================================================================
// Multiple Choice Input
// ============================================================================

interface MultipleChoiceInputProps {
  question: MultipleChoiceQuestion;
  answer?: MultipleChoiceDraftAnswer;
  onChange: (answer: DraftAnswer) => void;
  labelId: string;
}

function MultipleChoiceInput({
  question,
  answer,
  onChange,
  labelId,
}: MultipleChoiceInputProps): React.JSX.Element {
  const handleValueChange = (value: string) => {
    const newAnswer: MultipleChoiceDraftAnswer = {
      questionId: question.id,
      type: "multiple_choice",
      selectedOptionId: value,
    };
    onChange(newAnswer);
  };

  return (
    <RadioGroup
      value={answer?.selectedOptionId ?? undefined}
      onValueChange={handleValueChange}
      aria-labelledby={labelId}
      className="space-y-3"
    >
      {question.options.map((option, index) => (
        <div key={option.id} className="flex items-center space-x-3">
          <RadioGroupItem value={option.id} id={option.id} />
          <Label
            htmlFor={option.id}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {getOptionLabel(index)}
            </span>
            <span>{option.text}</span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

// ============================================================================
// True/False Input
// ============================================================================

interface TrueFalseInputProps {
  question: TrueFalseQuestion;
  answer?: TrueFalseDraftAnswer;
  onChange: (answer: DraftAnswer) => void;
  labelId: string;
}

function TrueFalseInput({
  question,
  answer,
  onChange,
  labelId,
}: TrueFalseInputProps): React.JSX.Element {
  const handleValueChange = (value: string) => {
    const newAnswer: TrueFalseDraftAnswer = {
      questionId: question.id,
      type: "true_false",
      selectedAnswer: value === "true",
    };
    onChange(newAnswer);
  };

  return (
    <RadioGroup
      value={answer?.selectedAnswer?.toString() ?? undefined}
      onValueChange={handleValueChange}
      aria-labelledby={labelId}
      className="space-y-3"
    >
      <div className="flex items-center space-x-3">
        <RadioGroupItem value="true" id={`${question.id}-true`} />
        <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
          True
        </Label>
      </div>
      <div className="flex items-center space-x-3">
        <RadioGroupItem value="false" id={`${question.id}-false`} />
        <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
          False
        </Label>
      </div>
    </RadioGroup>
  );
}

// ============================================================================
// Short Answer Input
// ============================================================================

interface ShortAnswerInputProps {
  question: ShortAnswerQuestion;
  answer?: ShortAnswerDraftAnswer;
  onChange: (answer: DraftAnswer) => void;
  labelId: string;
}

function ShortAnswerInput({
  question,
  answer,
  onChange,
  labelId,
}: ShortAnswerInputProps): React.JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswer: ShortAnswerDraftAnswer = {
      questionId: question.id,
      type: "short_answer",
      text: e.target.value,
    };
    onChange(newAnswer);
  };

  return (
    <Textarea
      value={answer?.text ?? ""}
      onChange={handleChange}
      placeholder="Type your answer here..."
      rows={3}
      aria-labelledby={labelId}
      className="min-h-[80px] resize-y"
    />
  );
}

// ============================================================================
// Fill-in-the-Blank Input
// ============================================================================

interface FillInBlankInputProps {
  question: FillInBlankQuestion;
  answer?: FillInBlankDraftAnswer;
  onChange: (answer: DraftAnswer) => void;
}

function FillInBlankInput({
  question,
  answer,
  onChange,
}: FillInBlankInputProps): React.JSX.Element {
  const handleBlankChange = (blankId: string, value: string) => {
    const newFilledAnswers = {
      ...(answer?.filledAnswers ?? {}),
      [blankId]: value,
    };

    const newAnswer: FillInBlankDraftAnswer = {
      questionId: question.id,
      type: "fill_in_the_blank",
      filledAnswers: newFilledAnswers,
    };
    onChange(newAnswer);
  };

  // Parse question text to find blanks (___)
  const blankPattern = /^_+$/;
  const parts = question.questionText.split(/(___+)/g);

  let blankIndex = 0;

  return (
    <div className="leading-relaxed">
      {parts.map((part, index) => {
        if (blankPattern.exec(part)) {
          const blank = question.blanks[blankIndex];
          if (!blank) return part;

          const currentIndex = blankIndex;
          blankIndex++;

          return (
            <Input
              key={`blank-${String(currentIndex)}`}
              value={answer?.filledAnswers[blank.id] ?? ""}
              onChange={(e) => { handleBlankChange(blank.id, e.target.value); }}
              placeholder={`Blank ${String(currentIndex + 1)}`}
              aria-label={`Blank ${String(currentIndex + 1)}`}
              className="inline-block w-32 mx-1 h-8 text-center"
            />
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Answer Input Component
 *
 * Renders the appropriate input UI based on question type:
 * - multiple_choice: RadioGroup with A, B, C, D labels
 * - true_false: Two radio buttons (True/False)
 * - short_answer: Multi-line textarea (min 3 rows)
 * - fill_in_the_blank: Inline text inputs replacing ___ placeholders
 *
 * @param props - Component props
 * @returns Answer input component
 *
 * @example
 * ```tsx
 * <AnswerInput
 *   question={question}
 *   answer={currentAnswer}
 *   onChange={handleAnswerChange}
 * />
 * ```
 */
export function AnswerInput({
  question,
  answer,
  onChange,
  className,
  testId,
}: AnswerInputProps): React.JSX.Element {
  const labelId = `question-${question.id}-label`;

  return (
    <div
      className={cn("mt-4", className)}
      data-testid={testId}
    >
      {question.type === "multiple_choice" && (
        <MultipleChoiceInput
          question={question}
          answer={answer as MultipleChoiceDraftAnswer | undefined}
          onChange={onChange}
          labelId={labelId}
        />
      )}

      {question.type === "true_false" && (
        <TrueFalseInput
          question={question}
          answer={answer as TrueFalseDraftAnswer | undefined}
          onChange={onChange}
          labelId={labelId}
        />
      )}

      {question.type === "short_answer" && (
        <ShortAnswerInput
          question={question}
          answer={answer as ShortAnswerDraftAnswer | undefined}
          onChange={onChange}
          labelId={labelId}
        />
      )}

      {question.type === "fill_in_the_blank" && (
        <FillInBlankInput
          question={question}
          answer={answer as FillInBlankDraftAnswer | undefined}
          onChange={onChange}
        />
      )}
    </div>
  );
}
