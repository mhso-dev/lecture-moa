/**
 * QuestionList Component
 * REQ-FE-632: Question list with drag-and-drop reordering
 *
 * Features:
 * - Drag-and-drop reordering with @dnd-kit
 * - Add, duplicate, delete actions
 * - Question count display
 */

"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { Plus, Copy, Trash2, GripVertical } from "lucide-react";
import type { Question, QuestionType } from "@shared/types/quiz.types";
import { Button } from "~/components/ui/button";
import { QuestionEditor } from "./question-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

interface QuestionListProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

// Generate a new UUID
const generateId = () => crypto.randomUUID();

// Create a new question template
const createNewQuestion = (order: number, type: QuestionType = "multiple_choice"): Question => {
  const base = {
    id: generateId(),
    quizId: "",
    order,
    questionText: "",
    points: 10,
    explanation: null as string | null,
  };

  switch (type) {
    case "multiple_choice":
      return {
        ...base,
        type: "multiple_choice" as const,
        options: [
          { id: generateId(), text: "" },
          { id: generateId(), text: "" },
        ],
        correctOptionId: "",
      };
    case "true_false":
      return {
        ...base,
        type: "true_false" as const,
        correctAnswer: true,
      };
    case "short_answer":
      return {
        ...base,
        type: "short_answer" as const,
        sampleAnswer: null,
      };
    case "fill_in_the_blank":
      return {
        ...base,
        type: "fill_in_the_blank" as const,
        blanks: [],
      };
  }
};

// Duplicate a question with new IDs
const duplicateQuestion = (question: Question, newOrder: number): Question => {
  const newId = generateId();

  switch (question.type) {
    case "multiple_choice": {
      const newOptions = question.options.map((opt) => ({
        ...opt,
        id: generateId(),
      }));
      const oldCorrectIndex = question.options.findIndex(
        (opt) => opt.id === question.correctOptionId
      );
      return {
        id: newId,
        quizId: question.quizId,
        order: newOrder,
        type: "multiple_choice" as const,
        questionText: question.questionText,
        points: question.points,
        explanation: question.explanation,
        options: newOptions,
        correctOptionId: newOptions[oldCorrectIndex]?.id ?? "",
      };
    }
    case "true_false":
      return {
        id: newId,
        quizId: question.quizId,
        order: newOrder,
        type: "true_false" as const,
        questionText: question.questionText,
        points: question.points,
        explanation: question.explanation,
        correctAnswer: question.correctAnswer,
      };
    case "short_answer":
      return {
        id: newId,
        quizId: question.quizId,
        order: newOrder,
        type: "short_answer" as const,
        questionText: question.questionText,
        points: question.points,
        explanation: question.explanation,
        sampleAnswer: question.sampleAnswer,
      };
    case "fill_in_the_blank":
      return {
        id: newId,
        quizId: question.quizId,
        order: newOrder,
        type: "fill_in_the_blank" as const,
        questionText: question.questionText,
        points: question.points,
        explanation: question.explanation,
        blanks: question.blanks.map((blank) => ({
          ...blank,
          id: generateId(),
        })),
      };
  }
};

// Sortable Question Item Component
interface SortableQuestionProps {
  question: Question;
  index: number;
  onQuestionChange: (index: number, question: Question) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
}

function SortableQuestion({
  question,
  index,
  onQuestionChange,
  onDuplicate,
  onDelete,
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: transform
      ? `translate3d(${String(transform.x)}px, ${String(transform.y)}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-4 cursor-grab active:cursor-grabbing p-2 -ml-8 text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <QuestionEditor
        question={question}
        index={index}
        onChange={(q) => { onQuestionChange(index, q as Question); }}
        onDelete={() => { onDelete(index); }}
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { onDuplicate(index); }}
        >
          <Copy className="h-4 w-4 mr-1" />
          Duplicate
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { onDelete(index); }}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}

/**
 * QuestionList - List of questions with drag-and-drop reordering
 * REQ-FE-632: Supports reordering, adding, duplicating, and deleting questions
 */
export function QuestionList({ questions, onChange }: QuestionListProps) {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const reordered = arrayMove(questions, oldIndex, newIndex).map(
        (q, idx) => ({ ...q, order: idx })
      );

      onChange(reordered);
    }
  };

  const handleQuestionChange = (index: number, question: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = question;
    onChange(newQuestions);
  };

  const handleAddQuestion = () => {
    const newQuestion = createNewQuestion(questions.length);
    onChange([...questions, newQuestion]);
  };

  const handleDuplicate = (index: number) => {
    const questionToDuplicate = questions[index];
    if (!questionToDuplicate) return;
    const duplicated = duplicateQuestion(questionToDuplicate, questions.length);
    const newQuestions = [
      ...questions.slice(0, index + 1),
      duplicated,
      ...questions.slice(index + 1),
    ].map((q, idx) => ({ ...q, order: idx }));
    onChange(newQuestions);
  };

  const handleDelete = (index: number) => {
    setDeleteIndex(index);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const newQuestions = questions
        .filter((_, idx) => idx !== deleteIndex)
        .map((q, idx) => ({ ...q, order: idx }));
      onChange(newQuestions);
      setDeleteIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Questions ({questions.length})
        </h3>
        <Button type="button" onClick={handleAddQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Question List */}
      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No questions yet. Click &quot;Add Question&quot; to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4 pl-8">
              {questions.map((question, index) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  index={index}
                  onQuestionChange={handleQuestionChange}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => { setDeleteIndex(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The question will be permanently removed from the quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
