/**
 * QuizManageTable Component
 * REQ-FE-650: Quiz Management Table for instructors
 *
 * Displays a table of quizzes with columns for title, course, status,
 * questions, submissions, due date, and actions.
 */

"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { QuizStatusBadge } from "../quiz-status-badge";
import {
  Pencil,
  Trash2,
  Copy,
  Users,
  ArrowUpDown,
} from "lucide-react";
import type { QuizListItem } from "@shared";

interface QuizManageTableProps {
  quizzes: QuizListItem[];
  onEdit?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  onDuplicate?: (quizId: string) => void;
  onManageSubmissions?: (quizId: string) => void;
  onSort?: (column: string) => void;
  onCreateNew?: () => void;
  className?: string;
  testId?: string;
}

/**
 * Format due date for display
 */
function formatDueDate(dueDate: string | null): string {
  if (!dueDate) {
    return "No due date";
  }

  const date = new Date(dueDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Sortable column header component
 */
function SortableHeader({
  children,
  column,
  onSort,
}: {
  children: React.ReactNode;
  column: string;
  onSort?: (column: string) => void;
}) {
  const handleClick = () => {
    onSort?.(column);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={handleClick}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" data-testid="sort-icon" />
    </Button>
  );
}

/**
 * Action buttons for each quiz row
 */
function QuizActions({
  quiz,
  onEdit,
  onDelete,
  onDuplicate,
  onManageSubmissions,
}: {
  quiz: QuizListItem;
  onEdit?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  onDuplicate?: (quizId: string) => void;
  onManageSubmissions?: (quizId: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit?.(quiz.id)}
        aria-label="Edit quiz"
        title="Edit"
      >
        <Pencil className="h-4 w-4" data-testid="pencil-icon" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onManageSubmissions?.(quiz.id)}
        aria-label="Manage submissions"
        title="Submissions"
      >
        <Users className="h-4 w-4" data-testid="users-icon" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDuplicate?.(quiz.id)}
        aria-label="Duplicate quiz"
        title="Duplicate"
      >
        <Copy className="h-4 w-4" data-testid="copy-icon" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete?.(quiz.id)}
        aria-label="Delete quiz"
        title="Delete"
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" data-testid="trash-icon" />
      </Button>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ onCreateNew }: { onCreateNew?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground mb-4">No quizzes yet</p>
      {onCreateNew && (
        <Button onClick={onCreateNew}>Create Quiz</Button>
      )}
    </div>
  );
}

export function QuizManageTable({
  quizzes,
  onEdit,
  onDelete,
  onDuplicate,
  onManageSubmissions,
  onSort,
  onCreateNew,
  className,
  testId,
}: QuizManageTableProps) {
  // Empty state
  if (quizzes.length === 0) {
    return (
      <div className={cn("rounded-lg border", className)} data-testid={testId}>
        <EmptyState onCreateNew={onCreateNew} />
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border", className)} data-testid={testId}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader column="title" onSort={onSort}>
                Title
              </SortableHeader>
            </TableHead>
            <TableHead>Course</TableHead>
            <TableHead>
              <SortableHeader column="status" onSort={onSort}>
                Status
              </SortableHeader>
            </TableHead>
            <TableHead className="text-center">Questions</TableHead>
            <TableHead className="text-center">
              <SortableHeader column="submissions" onSort={onSort}>
                Submissions
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="dueDate" onSort={onSort}>
                Due Date
              </SortableHeader>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {quizzes.map((quiz) => (
            <TableRow key={quiz.id}>
              {/* Title */}
              <TableCell className="font-medium">{quiz.title}</TableCell>

              {/* Course */}
              <TableCell>{quiz.courseName}</TableCell>

              {/* Status */}
              <TableCell>
                <QuizStatusBadge status={quiz.status} />
              </TableCell>

              {/* Questions */}
              <TableCell className="text-center">
                {quiz.questionCount}
              </TableCell>

              {/* Submissions */}
              <TableCell className="text-center">
                {quiz.attemptCount}
              </TableCell>

              {/* Due Date */}
              <TableCell>{formatDueDate(quiz.dueDate)}</TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <QuizActions
                  quiz={quiz}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onManageSubmissions={onManageSubmissions}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
