/**
 * Validators Index Export Tests
 * REQ-FE-702, REQ-FE-703: Verify team and memo schemas are exported correctly
 */

import { describe, expect, it } from "vitest";

// Import from the index to verify exports
import {
  // Team schemas (REQ-FE-702)
  CreateTeamSchema,
  UpdateTeamSchema,
  // Memo schemas (REQ-FE-703)
  CreateMemoSchema,
  UpdateMemoSchema,
} from "./index";

describe("Validators Index Exports", () => {
  describe("Team Schemas (REQ-FE-702)", () => {
    it("should export CreateTeamSchema", () => {
      const result = CreateTeamSchema.safeParse({
        name: "Test Team",
        maxMembers: 10,
      });
      expect(result.success).toBe(true);
    });

    it("should export UpdateTeamSchema", () => {
      const result = UpdateTeamSchema.safeParse({
        name: "Updated Team",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Memo Schemas (REQ-FE-703)", () => {
    it("should export CreateMemoSchema", () => {
      const result = CreateMemoSchema.safeParse({
        title: "Test Memo",
        content: "Content",
        visibility: "personal",
      });
      expect(result.success).toBe(true);
    });

    it("should export UpdateMemoSchema", () => {
      const result = UpdateMemoSchema.safeParse({
        title: "Updated Memo",
      });
      expect(result.success).toBe(true);
    });
  });
});
