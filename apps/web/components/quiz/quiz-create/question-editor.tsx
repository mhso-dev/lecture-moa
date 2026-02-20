/**
 * QuestionEditor Component
 * REQ-FE-631: Question editing interface
 *
 * Features:
 * - Shared fields: questionText, points, explanation
 * - Type-specific editors for each question type
 * - Supports both Question and GeneratedQuestion types
 */

"use client";

import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Question, GeneratedQuestion } from "@shared/types/quiz.types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Union type for editor support
type EditableQuestion = Question | GeneratedQuestion;

interface QuestionEditorProps {
  question: EditableQuestion;
  onChange: (question: EditableQuestion) => void;
  onDelete?: () => void;
  index: number;
}

/**
 * QuestionEditor - Editor for quiz questions
 * REQ-FE-631: Supports all question types with shared and type-specific fields
 */
export function QuestionEditor({
  question,
  onChange,
  onDelete,
  index,
}: QuestionEditorProps) {
  const id = useId();
  const questionNumber = index + 1;

  // Shared field handlers
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...question, questionText: e.target.value });
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...question, points: parseInt(e.target.value, 10) || 0 });
  };

  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...question, explanation: e.target.value || null });
  };

  // Type-specific handlers
  const handleMultipleChoiceChange = (
    optionId: string,
    _field: "text",
    value: string
  ) => {
    if (question.type !== "multiple_choice" || !question.options) return;
    const newOptions = question.options.map((opt) =>
      opt.id === optionId ? { ...opt, text: value } : opt
    );
    onChange({ ...question, options: newOptions });
  };

  const handleCorrectOptionChange = (optionId: string) => {
    if (question.type !== "multiple_choice") return;
    onChange({ ...question, correctOptionId: optionId });
  };

  const handleAddOption = () => {
    if (question.type !== "multiple_choice") return;
    const newOption = {
      id: `opt-${String(Date.now())}`,
      text: "",
    };
    onChange({
      ...question,
      options: [...(question.options ?? []), newOption],
    });
  };

  const handleRemoveOption = (optionId: string) => {
    if (question.type !== "multiple_choice" || !question.options) return;
    const newOptions = question.options.filter((opt) => opt.id !== optionId);
    onChange({ ...question, options: newOptions });
  };

  const handleTrueFalseChange = (value: string) => {
    if (question.type !== "true_false") return;
    onChange({ ...question, correctAnswer: value === "true" });
  };

  const handleSampleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (question.type !== "short_answer") return;
    // For GeneratedQuestion: sampleAnswer is string | undefined
    // For ShortAnswerQuestion: sampleAnswer is string | null
    const newValue = e.target.value || undefined;
    onChange({
      ...question,
      sampleAnswer: newValue,
    } as EditableQuestion);
  };

  const handleBlankAnswerChange = (blankId: string, value: string) => {
    if (question.type !== "fill_in_the_blank" || !question.blanks) return;
    const newBlanks = question.blanks.map((blank) =>
      blank.id === blankId ? { ...blank, answer: value } : blank
    );
    onChange({ ...question, blanks: newBlanks });
  };

  return (
    <div className="rounded-lg border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Question {questionNumber}</h4>
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            aria-label="Delete question"
          >
            <Trash2 className="h-4 w-4" />
            <span className="ml-1">Delete</span>
          </Button>
        )}
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <Label htmlFor={`${id}-text`}>Question Text</Label>
        <Textarea
          id={`${id}-text`}
          value={question.questionText}
          onChange={handleTextChange}
          placeholder="Enter your question"
          rows={2}
        />
      </div>

      {/* Points */}
      <div className="space-y-2">
        <Label htmlFor={`${id}-points`}>Points</Label>
        <Input
          id={`${id}-points`}
          type="number"
          value={question.points}
          onChange={handlePointsChange}
          min={1}
          max={100}
          className="w-24"
        />
      </div>

      {/* Type-specific fields */}
      {question.type === "multiple_choice" && (
        <div className="space-y-3">
          <Label>Options</Label>
          {question.options?.map((option, optIndex) => (
            <div key={option.id} className="flex items-center gap-2">
              <Input
                value={option.text}
                onChange={(e) => {
                  handleMultipleChoiceChange(option.id, "text", e.target.value);
                }}
                placeholder={`Option ${String(optIndex + 1)}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { handleRemoveOption(option.id); }}
                aria-label="Remove option"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Option
          </Button>

          {/* Correct Answer Selector */}
          <div className="space-y-2">
            <Label>Correct Answer</Label>
            <Select
              value={question.correctOptionId}
              onValueChange={handleCorrectOptionChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((opt, optIndex) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    Option {optIndex + 1}: {opt.text || "(empty)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {question.type === "true_false" && (
        <div className="space-y-2">
          <Label>Correct Answer</Label>
          <RadioGroup
            value={question.correctAnswer ? "true" : "false"}
            onValueChange={handleTrueFalseChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${id}-true`} />
              <Label htmlFor={`${id}-true`}>True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${id}-false`} />
              <Label htmlFor={`${id}-false`}>False</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {question.type === "short_answer" && (
        <div className="space-y-2">
          <Label htmlFor={`${id}-sample`}>Sample Answer</Label>
          <Textarea
            id={`${id}-sample`}
            value={question.sampleAnswer ?? ""}
            onChange={handleSampleAnswerChange}
            placeholder="Enter a sample answer for grading reference"
            rows={2}
          />
        </div>
      )}

      {question.type === "fill_in_the_blank" && (
        <div className="space-y-3">
          <Label>Blank Answers</Label>
          {question.blanks?.map((blank, blankIndex) => (
            <div key={blank.id} className="space-y-1">
              <Label htmlFor={`${id}-blank-${blank.id}`}>
                Blank {blankIndex + 1}
              </Label>
              <Input
                id={`${id}-blank-${blank.id}`}
                value={blank.answer}
                onChange={(e) => { handleBlankAnswerChange(blank.id, e.target.value); }}
                placeholder={`Answer for blank ${String(blankIndex + 1)}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Explanation (shared) */}
      <div className="space-y-2">
        <Label htmlFor={`${id}-explanation`}>Explanation (optional)</Label>
        <Textarea
          id={`${id}-explanation`}
          value={question.explanation ?? ""}
          onChange={handleExplanationChange}
          placeholder="Explain the correct answer (shown after quiz completion)"
          rows={2}
        />
      </div>
    </div>
  );
}
