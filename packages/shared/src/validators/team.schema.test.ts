/**
 * Team Schema Tests
 * REQ-FE-702: Test suite for team Zod validation schemas
 */

import { describe, expect, it } from "vitest";

import {
  CreateTeamSchema,
  UpdateTeamSchema,
} from "./team.schema";

describe("Team Schemas", () => {
  describe("CreateTeamSchema", () => {
    it("should validate valid team creation data", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Study Group Alpha",
        description: "A study group for beginners",
        maxMembers: 10,
        courseId: "123e4567-e89b-12d3-a456-426614174001",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Study Group Alpha");
        expect(result.data.maxMembers).toBe(10);
      }
    });

    it("should use default maxMembers of 10 when not provided", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Study Group",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxMembers).toBe(10);
      }
    });

    it("should validate minimum name length (2 chars)", () => {
      const result = CreateTeamSchema.safeParse({
        name: "AB",
        maxMembers: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should reject name shorter than 2 characters", () => {
      const result = CreateTeamSchema.safeParse({
        name: "A",
        maxMembers: 5,
      });
      expect(result.success).toBe(false);
    });

    it("should validate maximum name length (50 chars)", () => {
      const result = CreateTeamSchema.safeParse({
        name: "A".repeat(50),
        maxMembers: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should reject name longer than 50 characters", () => {
      const result = CreateTeamSchema.safeParse({
        name: "A".repeat(51),
        maxMembers: 5,
      });
      expect(result.success).toBe(false);
    });

    it("should validate maximum description length (500 chars)", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Team",
        description: "A".repeat(500),
        maxMembers: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should reject description longer than 500 characters", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Team",
        description: "A".repeat(501),
        maxMembers: 5,
      });
      expect(result.success).toBe(false);
    });

    it("should validate minimum maxMembers (2)", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Team",
        maxMembers: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should reject maxMembers less than 2", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Team",
        maxMembers: 1,
      });
      expect(result.success).toBe(false);
    });

    it("should validate maximum maxMembers (100)", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Team",
        maxMembers: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should reject maxMembers greater than 100", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Team",
        maxMembers: 101,
      });
      expect(result.success).toBe(false);
    });

    it("should accept valid UUID for courseId", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Team",
        courseId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should allow optional courseId", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Team",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.courseId).toBeUndefined();
      }
    });
  });

  describe("UpdateTeamSchema", () => {
    it("should validate partial update with name only", () => {
      const result = UpdateTeamSchema.safeParse({
        name: "Updated Team Name",
      });
      expect(result.success).toBe(true);
    });

    it("should validate partial update with maxMembers only", () => {
      const result = UpdateTeamSchema.safeParse({
        maxMembers: 20,
      });
      expect(result.success).toBe(true);
    });

    it("should validate empty update", () => {
      const result = UpdateTeamSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should still validate name constraints in update", () => {
      const result = UpdateTeamSchema.safeParse({
        name: "A",
      });
      expect(result.success).toBe(false);
    });

    it("should still validate maxMembers constraints in update", () => {
      const result = UpdateTeamSchema.safeParse({
        maxMembers: 150,
      });
      expect(result.success).toBe(false);
    });
  });
});
