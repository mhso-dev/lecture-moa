/**
 * Tag Limit Tests
 * REQ-FE-N703: Tags shall be limited to max 10 items and 30 chars each
 */

import { describe, it, expect } from "vitest";
import {
  CreateMemoSchema,
  UpdateMemoSchema,
} from "@shared/validators/memo.schema";

describe("Tag Limit - REQ-FE-N703", () => {
  describe("Tag count limit (max 10)", () => {
    it("should accept exactly 10 tags", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        visibility: "personal",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toHaveLength(10);
      }
    });

    it("should reject more than 10 tags", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
        visibility: "personal",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const tagError = result.error.errors.find((e) => e.path[0] === "tags");
        expect(tagError?.message).toContain("10");
      }
    });

    it("should accept fewer than 10 tags", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["tag1", "tag2"],
        visibility: "personal",
      });

      expect(result.success).toBe(true);
    });

    it("should accept empty tags array", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: [],
        visibility: "personal",
      });

      expect(result.success).toBe(true);
    });

    it("should accept memo without tags", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        visibility: "personal",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Tag character limit (max 30 chars)", () => {
    it("should accept tag with exactly 30 characters", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["a".repeat(30)],
        visibility: "personal",
      });

      expect(result.success).toBe(true);
    });

    it("should reject tag longer than 30 characters", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["a".repeat(31)],
        visibility: "personal",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const tagError = result.error.errors.find((e) => e.path[0] === "tags");
        expect(tagError?.message).toContain("30");
      }
    });

    it("should accept tag with fewer than 30 characters", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["short-tag"],
        visibility: "personal",
      });

      expect(result.success).toBe(true);
    });

    it("should validate each tag individually", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["valid", "a".repeat(31), "also-valid"],
        visibility: "personal",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Update schema tag validation", () => {
    it("should enforce max 10 tags on update", () => {
      const result = UpdateMemoSchema.safeParse({
        tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const tagError = result.error.errors.find((e) => e.path[0] === "tags");
        expect(tagError?.message).toContain("10");
      }
    });

    it("should enforce max 30 chars per tag on update", () => {
      const result = UpdateMemoSchema.safeParse({
        tags: ["a".repeat(31)],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const tagError = result.error.errors.find((e) => e.path[0] === "tags");
        expect(tagError?.message).toContain("30");
      }
    });

    it("should accept valid tags on update", () => {
      const result = UpdateMemoSchema.safeParse({
        tags: ["valid-tag", "another-valid-tag"],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle tags with special characters", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["tag-with-dash", "tag_with_underscore", "tag.with.dot"],
        visibility: "personal",
      });

      expect(result.success).toBe(true);
    });

    it("should handle tags with unicode characters", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["태그", "标签", "タグ"],
        visibility: "personal",
      });

      expect(result.success).toBe(true);
    });

    it("should handle empty string tag", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: [""],
        visibility: "personal",
      });

      // Empty string is valid (no min length specified in schema)
      expect(result.success).toBe(true);
    });

    it("should handle tags with spaces", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["tag with spaces"],
        visibility: "personal",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Schema validation error messages", () => {
    it("should provide clear error for tag count exceeded", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: Array.from({ length: 15 }, (_, i) => `tag-${i}`),
        visibility: "personal",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.errors
          .map((e) => e.message)
          .join(", ");
        expect(errorMessage).toContain("10");
      }
    });

    it("should provide clear error for tag length exceeded", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Test content",
        tags: ["this-is-a-very-long-tag-that-exceeds-thirty-characters"],
        visibility: "personal",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.errors
          .map((e) => e.message)
          .join(", ");
        expect(errorMessage).toContain("30");
      }
    });
  });

  describe("Integration with form validation", () => {
    it("should validate tags before submission", () => {
      const formData = {
        title: "New Memo",
        content: "Content here",
        tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
        visibility: "personal" as const,
      };

      const result = CreateMemoSchema.safeParse(formData);

      // Form should not be submittable with invalid tags
      expect(result.success).toBe(false);
    });

    it("should validate tags with exact limits", () => {
      const formData = {
        title: "New Memo",
        content: "Content here",
        tags: ["a".repeat(30), "b".repeat(30), "c".repeat(30)],
        visibility: "personal" as const,
      };

      const result = CreateMemoSchema.safeParse(formData);

      // Should pass with exact limits
      expect(result.success).toBe(true);
    });
  });
});
