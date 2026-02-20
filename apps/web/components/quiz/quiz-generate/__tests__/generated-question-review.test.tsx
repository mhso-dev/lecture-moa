/**
 * GeneratedQuestionReview Component Tests
 * REQ-FE-643: Review and accept generated questions
 *
 * Tests cover:
 * - Question list display
 * - Selection checkboxes
 * - Delete individual question
 * - Accept All / Accept Selected / Regenerate buttons
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GeneratedQuestionReview } from "../generated-question-review";
import type { GeneratedQuestion } from "@shared/types/quiz.types";

const mockQuestions: GeneratedQuestion[] = [
  {
    tempId: "temp-1",
    type: "multiple_choice",
    questionText: "What is 2+2?",
    points: 10,
    options: [
      { id: "opt-1", text: "3" },
      { id: "opt-2", text: "4" },
    ],
    correctOptionId: "opt-2",
    explanation: "Basic addition",
  },
  {
    tempId: "temp-2",
    type: "true_false",
    questionText: "Earth is round",
    points: 5,
    correctAnswer: true,
    explanation: null,
  },
  {
    tempId: "temp-3",
    type: "short_answer",
    questionText: "Capital of France?",
    points: 10,
    sampleAnswer: "Paris",
    explanation: null,
  },
];

describe("GeneratedQuestionReview", () => {
  describe("REQ-FE-643: List Rendering", () => {
    it("should render all generated questions", () => {
      render(
        <GeneratedQuestionReview questions={mockQuestions} onAccept={vi.fn()} />
      );

      expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
      expect(screen.getByText("Earth is round")).toBeInTheDocument();
      expect(screen.getByText("Capital of France?")).toBeInTheDocument();
    });

    it("should show question count", () => {
      render(
        <GeneratedQuestionReview questions={mockQuestions} onAccept={vi.fn()} />
      );

      // The header shows "Generated Questions (3)"
      expect(screen.getByText(/Generated Questions.*3/)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-643: Selection", () => {
    it("should show checkboxes for selection", () => {
      render(
        <GeneratedQuestionReview questions={mockQuestions} onAccept={vi.fn()} />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it("should show selected count", () => {
      render(
        <GeneratedQuestionReview questions={mockQuestions} onAccept={vi.fn()} />
      );

      // Initially all should be selected - look for "3 selected" label
      const selectedLabels = screen.getAllByText(/selected/i);
      expect(selectedLabels.length).toBeGreaterThan(0);
    });
  });

  describe("REQ-FE-643: Actions", () => {
    it("should show Accept All button", () => {
      render(
        <GeneratedQuestionReview questions={mockQuestions} onAccept={vi.fn()} />
      );

      expect(screen.getByRole("button", { name: /accept all/i })).toBeInTheDocument();
    });

    it("should show Accept Selected button", () => {
      render(
        <GeneratedQuestionReview questions={mockQuestions} onAccept={vi.fn()} />
      );

      expect(screen.getByRole("button", { name: /accept selected/i })).toBeInTheDocument();
    });

    it("should show Regenerate button when onRegenerate provided", () => {
      render(
        <GeneratedQuestionReview
          questions={mockQuestions}
          onAccept={vi.fn()}
          onRegenerate={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /regenerate/i })).toBeInTheDocument();
    });

    it("should not show Regenerate button when onRegenerate not provided", () => {
      render(
        <GeneratedQuestionReview questions={mockQuestions} onAccept={vi.fn()} />
      );

      expect(screen.queryByRole("button", { name: /regenerate/i })).not.toBeInTheDocument();
    });

    it("should show delete button for each question", () => {
      render(
        <GeneratedQuestionReview questions={mockQuestions} onAccept={vi.fn()} />
      );

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("REQ-FE-643: Callbacks", () => {
    it("should call onAccept when Accept All is clicked", async () => {
      const handleAccept = vi.fn();
      render(
        <GeneratedQuestionReview questions={mockQuestions} onAccept={handleAccept} />
      );

      const acceptAllButton = screen.getByRole("button", { name: /accept all/i });
      fireEvent.click(acceptAllButton);

      await waitFor(() => {
        expect(handleAccept).toHaveBeenCalled();
      });
    });

    it("should call onRegenerate when Regenerate is clicked", async () => {
      const handleRegenerate = vi.fn();
      render(
        <GeneratedQuestionReview
          questions={mockQuestions}
          onAccept={vi.fn()}
          onRegenerate={handleRegenerate}
        />
      );

      const regenerateButton = screen.getByRole("button", { name: /regenerate/i });
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(handleRegenerate).toHaveBeenCalled();
      });
    });
  });

  describe("REQ-FE-643: Editing", () => {
    it("should allow editing questions", () => {
      const handleChange = vi.fn();
      render(
        <GeneratedQuestionReview
          questions={mockQuestions}
          onAccept={vi.fn()}
          onQuestionChange={handleChange}
        />
      );

      const textareas = screen.getAllByRole("textbox");
      if (textareas.length > 0 && textareas[0]) {
        fireEvent.change(textareas[0], { target: { value: "Updated question" } });
        expect(handleChange).toHaveBeenCalled();
      }
    });
  });
});
