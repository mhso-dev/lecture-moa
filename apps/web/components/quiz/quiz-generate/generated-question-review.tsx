/**
 * GeneratedQuestionReview Component
 * REQ-FE-643: Review and accept generated questions
 *
 * Features:
 * - Uses QuestionEditor for each question (editable)
 * - Checkbox per question for selection
 * - Delete individual question button
 * - Accept All / Accept Selected / Regenerate buttons
 */

"use client";

import { useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import type { GeneratedQuestion } from "@shared/types/quiz.types";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { QuestionEditor } from "../quiz-create/question-editor";

interface GeneratedQuestionReviewProps {
  questions: GeneratedQuestion[];
  onAccept: (questions: GeneratedQuestion[]) => void;
  onRegenerate?: () => void;
  onQuestionChange?: (index: number, question: GeneratedQuestion) => void;
}

/**
 * GeneratedQuestionReview - Review and accept AI-generated questions
 * REQ-FE-643: Allows selection, editing, and acceptance of generated questions
 */
export function GeneratedQuestionReview({
  questions: initialQuestions,
  onAccept,
  onRegenerate,
  onQuestionChange,
}: GeneratedQuestionReviewProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialQuestions.map((q) => q.tempId))
  );

  const selectedCount = selectedIds.size;
  const allSelected = selectedCount === questions.length;

  const handleToggleSelect = (tempId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(tempId)) {
      newSelected.delete(tempId);
    } else {
      newSelected.add(tempId);
    }
    setSelectedIds(newSelected);
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.tempId)));
    }
  };

  const handleQuestionChange = (index: number, updatedQuestion: GeneratedQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
    onQuestionChange?.(index, updatedQuestion);
  };

  const handleDelete = (tempId: string) => {
    const newQuestions = questions.filter((q) => q.tempId !== tempId);
    setQuestions(newQuestions);
    const newSelected = new Set(selectedIds);
    newSelected.delete(tempId);
    setSelectedIds(newSelected);
  };

  const handleAcceptAll = () => {
    onAccept(questions);
  };

  const handleAcceptSelected = () => {
    const selectedQuestions = questions.filter((q) => selectedIds.has(q.tempId));
    onAccept(selectedQuestions);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">
            Generated Questions ({questions.length})
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={handleToggleAll}
            />
            <Label htmlFor="select-all" className="cursor-pointer">
              {selectedCount} selected
            </Label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onRegenerate && (
            <Button type="button" variant="outline" onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleAcceptSelected}
            disabled={selectedCount === 0}
          >
            Accept Selected ({selectedCount})
          </Button>
          <Button type="button" onClick={handleAcceptAll}>
            <Check className="h-4 w-4 mr-2" />
            Accept All
          </Button>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.tempId} className="relative pl-10">
            {/* Selection Checkbox */}
            <div className="absolute left-0 top-4">
              <Checkbox
                id={`select-${question.tempId}`}
                checked={selectedIds.has(question.tempId)}
                onCheckedChange={() => { handleToggleSelect(question.tempId); }}
              />
            </div>

            {/* Question Editor */}
            <QuestionEditor
              question={question}
              index={index}
              onChange={(q) => { handleQuestionChange(index, q as GeneratedQuestion); }}
              onDelete={() => { handleDelete(question.tempId); }}
            />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {questions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No questions generated. Click Regenerate to try again.</p>
        </div>
      )}
    </div>
  );
}
