/**
 * QuestionDisplay Component
 * REQ-FE-612: Question Display
 *
 * Renders question text with lightweight Markdown and answer input
 */

"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { AnswerInput } from "./answer-input";
import type { Question, DraftAnswer } from "@shared";

// ============================================================================
// Types
// ============================================================================

export interface QuestionDisplayProps {
  /** The question to display */
  question: Question;
  /** Current question number (1-indexed) */
  questionNumber: number;
  /** Total number of questions */
  totalQuestions: number;
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
// Lightweight Markdown Renderer
// ============================================================================

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

/**
 * Lightweight Markdown renderer supporting:
 * - **bold** -> <strong>
 * - _italic_ -> <em>
 * - `code` -> <code>
 * - [text](url) -> <a>
 */
function MarkdownRenderer({ text, className }: MarkdownRendererProps): React.JSX.Element {
  // Parse and render markdown
  const parseMarkdown = (input: string): React.ReactNode => {
    const elements: React.ReactNode[] = [];
    let remaining = input;
    let key = 0;

    const boldPattern = /^\*\*(.+?)\*\*/;
    const italicPattern = /^_(.+?)_(?!_)/;
    const codePattern = /^`(.+?)`/;
    const linkPattern = /^\[([^\]]+)\]\(([^)]+)\)/;
    const specialCharsPattern = /[*_`[\]]/;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = boldPattern.exec(remaining);
      if (boldMatch) {
        elements.push(
          <strong key={key++} style={{ fontWeight: "bold" }}>
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic: _text_ (single underscore)
      const italicMatch = italicPattern.exec(remaining);
      if (italicMatch) {
        elements.push(
          <em key={key++} style={{ fontStyle: "italic" }}>
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Inline code: `text`
      const codeMatch = codePattern.exec(remaining);
      if (codeMatch) {
        elements.push(
          <code
            key={key++}
            role="code"
            className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Link: [text](url)
      const linkMatch = linkPattern.exec(remaining);
      if (linkMatch) {
        elements.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Regular text - find next special character
      const nextSpecial = remaining.search(specialCharsPattern);
      if (nextSpecial === -1) {
        elements.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Special character but no match - output as is
        elements.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        elements.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return elements;
  };

  return <span className={className}>{parseMarkdown(text)}</span>;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Question Display Component
 *
 * Renders question with:
 * - Question number and total
 * - Question text with lightweight Markdown
 * - Points indicator
 * - Answer input appropriate to question type
 *
 * @param props - Component props
 * @returns Question display component
 *
 * @example
 * ```tsx
 * <QuestionDisplay
 *   question={question}
 *   questionNumber={1}
 *   totalQuestions={10}
 *   answer={currentAnswer}
 *   onChange={handleAnswerChange}
 * />
 * ```
 */
export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onChange,
  className,
  testId,
}: QuestionDisplayProps): React.JSX.Element {
  const labelId = `question-${question.id}-label`;

  return (
    <div
      className={cn("space-y-4", className)}
      data-testid={testId}
      aria-labelledby={labelId}
    >
      {/* Question header */}
      <div className="space-y-2">
        <div id={labelId} className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            문항 {questionNumber} / {totalQuestions}
          </h2>
          <span className="text-sm text-muted-foreground">
            {question.points}점
          </span>
        </div>
      </div>

      {/* Question text with Markdown */}
      <div className="text-base leading-relaxed">
        <MarkdownRenderer text={question.questionText} />
      </div>

      {/* Answer input */}
      <AnswerInput
        question={question}
        answer={answer}
        onChange={onChange}
      />
    </div>
  );
}
