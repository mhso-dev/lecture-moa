/**
 * stripMarkdown Utility Tests
 * REQ-FE-N704: Tests for Markdown stripping utility
 */

import { describe, it, expect } from "vitest";
import { stripMarkdown } from "./markdown";

describe("stripMarkdown", () => {
  describe("basic Markdown removal", () => {
    it("should remove bold syntax", () => {
      expect(stripMarkdown("This is **bold** text")).toBe("This is bold text");
      expect(stripMarkdown("This is __bold__ text")).toBe("This is bold text");
    });

    it("should remove italic syntax", () => {
      expect(stripMarkdown("This is *italic* text")).toBe("This is italic text");
      expect(stripMarkdown("This is _italic_ text")).toBe("This is italic text");
    });

    it("should remove inline code", () => {
      expect(stripMarkdown("Use `code` here")).toBe("Use code here");
    });

    it("should remove links but keep text", () => {
      expect(stripMarkdown("[Google](https://google.com)")).toBe("Google");
      expect(stripMarkdown("Check [this link](https://example.com)")).toBe(
        "Check this link"
      );
    });

    it("should remove headings", () => {
      expect(stripMarkdown("# Heading 1")).toBe("Heading 1");
      expect(stripMarkdown("## Heading 2")).toBe("Heading 2");
      expect(stripMarkdown("### Heading 3")).toBe("Heading 3");
    });

    it("should remove code blocks", () => {
      const codeBlock = `\`\`\`javascript
const x = 1;
\`\`\``;
      expect(stripMarkdown(codeBlock)).toBe("const x = 1;");
    });

    it("should remove list markers", () => {
      expect(stripMarkdown("- List item")).toBe("List item");
      expect(stripMarkdown("* List item")).toBe("List item");
      expect(stripMarkdown("1. Numbered item")).toBe("Numbered item");
    });

    it("should remove blockquotes", () => {
      expect(stripMarkdown("> Quote text")).toBe("Quote text");
    });
  });

  describe("maxLength parameter", () => {
    it("should truncate to specified length", () => {
      const longText = "This is a very long text that needs truncation";
      expect(stripMarkdown(longText, 20)).toBe("This is a very long...");
    });

    it("should default to 150 characters", () => {
      const longText = "a".repeat(200);
      const result = stripMarkdown(longText);
      expect(result.length).toBe(153); // 150 + "..."
    });

    it("should not truncate if text is shorter than maxLength", () => {
      const shortText = "Short text";
      expect(stripMarkdown(shortText, 100)).toBe("Short text");
    });

    it("should not add ellipsis if text fits exactly", () => {
      const text = "Exactly twenty chars";
      expect(stripMarkdown(text, 20)).toBe("Exactly twenty chars");
    });
  });

  describe("complex Markdown", () => {
    it("should handle mixed Markdown syntax", () => {
      const mixed =
        "# Title\n\nThis has **bold**, *italic*, and `code`.";
      expect(stripMarkdown(mixed, 100)).toBe(
        "Title This has bold, italic, and code."
      );
    });

    it("should handle multiple links", () => {
      const multiLinks =
        "Check [First](url1) and [Second](url2) links";
      expect(stripMarkdown(multiLinks)).toBe(
        "Check First and Second links"
      );
    });

    it("should normalize whitespace", () => {
      const whitespace =
        "Text   with    extra    spaces";
      expect(stripMarkdown(whitespace)).toBe("Text with extra spaces");
    });

    it("should trim leading and trailing whitespace", () => {
      expect(stripMarkdown("  Trimmed text  ")).toBe("Trimmed text");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      expect(stripMarkdown("")).toBe("");
    });

    it("should handle plain text without Markdown", () => {
      expect(stripMarkdown("Just plain text")).toBe("Just plain text");
    });

    it("should handle Markdown with no closing syntax", () => {
      expect(stripMarkdown("**unclosed bold")).toBe("**unclosed bold");
    });

    it("should handle nested Markdown", () => {
      expect(stripMarkdown("**_bold and italic_**")).toBe(
        "bold and italic"
      );
    });
  });
});
