/**
 * Tests for Phase 5 - Team Memo Board Components
 */

import { describe, it, expect } from "vitest";
import { stripMarkdown } from "@shared/utils/markdown";

describe("Phase 5 - Team Memo Board", () => {
  describe("stripMarkdown utility", () => {
    it("should strip basic Markdown", () => {
      expect(stripMarkdown("**bold**")).toBe("bold");
      expect(stripMarkdown("*italic*")).toBe("italic");
      expect(stripMarkdown("# Heading")).toBe("Heading");
    });

    it("should handle complex Markdown", () => {
      const markdown = "# Title\n\nThis is **bold** and *italic* text.";
      expect(stripMarkdown(markdown)).toContain("Title");
      expect(stripMarkdown(markdown)).toContain("bold");
      expect(stripMarkdown(markdown)).toContain("italic");
    });

    it("should truncate to default 150 chars", () => {
      const longText = "a".repeat(200);
      const result = stripMarkdown(longText);
      expect(result.length).toBe(153); // 150 + "..."
    });
  });
});
