/**
 * Memo Schema Tests
 * REQ-FE-703: Test suite for memo Zod validation schemas
 */

import { describe, expect, it } from "vitest";

import {
  CreateMemoSchema,
  UpdateMemoSchema,
} from "./memo.schema";

describe("Memo Schemas", () => {
  describe("CreateMemoSchema", () => {
    it("should validate valid personal memo creation data", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Study Notes",
        content: "Important concepts to remember",
        visibility: "personal",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Study Notes");
        expect(result.data.visibility).toBe("personal");
      }
    });

    it("should validate valid team memo creation data", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Team Study Notes",
        content: "Shared notes for the team",
        teamId: "123e4567-e89b-12d3-a456-426614174000",
        visibility: "team",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibility).toBe("team");
      }
    });

    it("should validate title maximum length (200 chars)", () => {
      const result = CreateMemoSchema.safeParse({
        title: "A".repeat(200),
        content: "Content",
        visibility: "personal",
      });
      expect(result.success).toBe(true);
    });

    it("should reject title longer than 200 characters", () => {
      const result = CreateMemoSchema.safeParse({
        title: "A".repeat(201),
        content: "Content",
        visibility: "personal",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty title", () => {
      const result = CreateMemoSchema.safeParse({
        title: "",
        content: "Content",
        visibility: "personal",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing title", () => {
      const result = CreateMemoSchema.safeParse({
        content: "Content",
        visibility: "personal",
      });
      expect(result.success).toBe(false);
    });

    it("should require content with at least 1 character", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "A",
        visibility: "personal",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty content", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "",
        visibility: "personal",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing content", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        visibility: "personal",
      });
      expect(result.success).toBe(false);
    });

    it("should validate tags array with max 10 items", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "Content",
        tags: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
        visibility: "personal",
      });
      expect(result.success).toBe(true);
    });

    it("should reject tags array with more than 10 items", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "Content",
        tags: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11"],
        visibility: "personal",
      });
      expect(result.success).toBe(false);
    });

    it("should validate tag maximum length (30 chars)", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "Content",
        tags: ["A".repeat(30)],
        visibility: "personal",
      });
      expect(result.success).toBe(true);
    });

    it("should reject tag longer than 30 characters", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "Content",
        tags: ["A".repeat(31)],
        visibility: "personal",
      });
      expect(result.success).toBe(false);
    });

    it("should accept optional materialId as UUID", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "Content",
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        visibility: "personal",
      });
      expect(result.success).toBe(true);
    });

    it("should accept optional anchorId as string", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "Content",
        anchorId: "anchor-123",
        visibility: "personal",
      });
      expect(result.success).toBe(true);
    });

    it("should accept optional teamId as UUID", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "Content",
        teamId: "123e4567-e89b-12d3-a456-426614174000",
        visibility: "team",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid visibility value", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "Content",
        visibility: "public",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing visibility", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Title",
        content: "Content",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateMemoSchema", () => {
    it("should validate partial update with title only", () => {
      const result = UpdateMemoSchema.safeParse({
        title: "Updated Title",
      });
      expect(result.success).toBe(true);
    });

    it("should validate partial update with content only", () => {
      const result = UpdateMemoSchema.safeParse({
        content: "Updated content",
      });
      expect(result.success).toBe(true);
    });

    it("should validate partial update with visibility only", () => {
      const result = UpdateMemoSchema.safeParse({
        visibility: "team",
      });
      expect(result.success).toBe(true);
    });

    it("should validate partial update with isDraft", () => {
      const result = UpdateMemoSchema.safeParse({
        isDraft: false,
      });
      expect(result.success).toBe(true);
    });

    it("should validate empty update", () => {
      const result = UpdateMemoSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should still validate title constraints in update", () => {
      const result = UpdateMemoSchema.safeParse({
        title: "A".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("should still validate content constraints in update", () => {
      const result = UpdateMemoSchema.safeParse({
        content: "",
      });
      expect(result.success).toBe(false);
    });

    it("should still validate visibility enum in update", () => {
      const result = UpdateMemoSchema.safeParse({
        visibility: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });
});
