/**
 * GenerationOptions Component Tests
 * REQ-FE-641: AI generation options configuration
 *
 * Tests cover:
 * - Material selection integration
 * - Question count configuration
 * - Difficulty selection
 * - Question type selection
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GenerationOptions } from "../generation-options";
import type { GenerationOptions as GenerationOptionsType } from "@shared/types/quiz.types";

const mockMaterials = [
  { id: "mat-1", title: "Material 1", courseId: "course-1", courseName: "Course 1", content: "Content 1" },
  { id: "mat-2", title: "Material 2", courseId: "course-1", courseName: "Course 1", content: "Content 2" },
];

const defaultOptions: GenerationOptionsType = {
  materialIds: ["mat-1"],
  count: 10,
  difficulty: "medium",
  questionTypes: ["multiple_choice", "true_false"],
};

describe("GenerationOptions", () => {
  describe("REQ-FE-641: Form Fields", () => {
    it("should render material selector", () => {
      render(
        <GenerationOptions
          options={defaultOptions}
          onChange={vi.fn()}
          materials={mockMaterials}
        />
      );

      expect(screen.getByText(/select materials/i)).toBeInTheDocument();
    });

    it("should render question count input", () => {
      render(
        <GenerationOptions
          options={defaultOptions}
          onChange={vi.fn()}
          materials={mockMaterials}
        />
      );

      expect(screen.getByLabelText(/number of questions/i)).toBeInTheDocument();
    });

    it("should render difficulty selector", () => {
      render(
        <GenerationOptions
          options={defaultOptions}
          onChange={vi.fn()}
          materials={mockMaterials}
        />
      );

      expect(screen.getByText(/difficulty/i)).toBeInTheDocument();
    });

    it("should render question type checkboxes", () => {
      render(
        <GenerationOptions
          options={defaultOptions}
          onChange={vi.fn()}
          materials={mockMaterials}
        />
      );

      expect(screen.getByText(/question types/i)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-641: Validation", () => {
    it("should show count range (1-50)", () => {
      render(
        <GenerationOptions
          options={defaultOptions}
          onChange={vi.fn()}
          materials={mockMaterials}
        />
      );

      const countInput = screen.getByLabelText(/number of questions/i);
      expect(countInput).toHaveAttribute("min", "1");
      expect(countInput).toHaveAttribute("max", "50");
    });
  });

  describe("REQ-FE-641: onChange Handler", () => {
    it("should call onChange when count changes", () => {
      const handleChange = vi.fn();
      render(
        <GenerationOptions
          options={defaultOptions}
          onChange={handleChange}
          materials={mockMaterials}
        />
      );

      const countInput = screen.getByLabelText(/number of questions/i);
      fireEvent.change(countInput, { target: { value: "15" } });

      expect(handleChange).toHaveBeenCalled();
    });

    it("should call onChange when difficulty changes", () => {
      const handleChange = vi.fn();
      render(
        <GenerationOptions
          options={defaultOptions}
          onChange={handleChange}
          materials={mockMaterials}
        />
      );

      // Look for difficulty radio/segment control
      const easyOption = screen.getByLabelText(/easy/i);
      fireEvent.click(easyOption);
      expect(handleChange).toHaveBeenCalled();
    });
  });
});
