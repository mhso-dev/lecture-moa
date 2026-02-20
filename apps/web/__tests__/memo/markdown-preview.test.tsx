/**
 * Markdown Preview Tests
 * REQ-FE-N704: Memo previews shall show plain text without markdown syntax
 */

import { describe, it, expect } from "vitest";
import { stripMarkdown } from "@shared/utils/markdown";

describe("Markdown Preview - REQ-FE-N704", () => {
  describe("stripMarkdown function", () => {
    it("should remove bold syntax", () => {
      const result = stripMarkdown("**bold text**");
      expect(result).toBe("bold text");
    });

    it("should remove italic syntax", () => {
      const result = stripMarkdown("*italic text*");
      expect(result).toBe("italic text");
    });

    it("should remove heading syntax", () => {
      const result = stripMarkdown("# Heading 1");
      expect(result).toBe("Heading 1");
    });

    it("should remove code block syntax", () => {
      const result = stripMarkdown("```\ncode here\n```");
      expect(result).toBe("code here");
    });

    it("should remove inline code syntax", () => {
      const result = stripMarkdown("`inline code`");
      expect(result).toBe("inline code");
    });

    it("should remove link syntax but keep text", () => {
      const result = stripMarkdown("[link text](https://example.com)");
      expect(result).toBe("link text");
    });

    it("should remove image syntax", () => {
      const result = stripMarkdown("![alt text](image.png)");
      // Image syntax is replaced with alt text
      expect(result).toContain("alt text");
      expect(result).not.toContain("![]");
    });

    it("should remove list markers", () => {
      const result = stripMarkdown("- List item");
      expect(result).toBe("List item");
    });

    it("should remove ordered list markers", () => {
      const result = stripMarkdown("1. First item");
      expect(result).toBe("First item");
    });

    it("should remove blockquote syntax", () => {
      const result = stripMarkdown("> Quoted text");
      expect(result).toBe("Quoted text");
    });

    it("should remove strikethrough syntax", () => {
      const result = stripMarkdown("~~strikethrough~~");
      expect(result).toBe("strikethrough");
    });

    it("should remove HTML tags", () => {
      const result = stripMarkdown("<strong>bold</strong>");
      expect(result).toBe("bold");
    });

    it("should handle multiple markdown elements", () => {
      const result = stripMarkdown(
        "# Title\n\n**Bold** and *italic* with `code`"
      );
      expect(result).toBe("Title Bold and italic with code");
    });

    it("should handle empty input", () => {
      const result = stripMarkdown("");
      expect(result).toBe("");
    });

    it("should handle null-like input", () => {
      const result = stripMarkdown(null as unknown as string);
      expect(result).toBe("");
    });
  });

  describe("stripMarkdown truncation", () => {
    it("should truncate text to default max length (150)", () => {
      const longText = "a".repeat(200);
      const result = stripMarkdown(longText);

      expect(result.length).toBeLessThanOrEqual(153); // 150 + "..."
      expect(result.endsWith("...")).toBe(true);
    });

    it("should truncate to custom max length", () => {
      const longText = "a".repeat(100);
      const result = stripMarkdown(longText, 50);

      expect(result.length).toBeLessThanOrEqual(53); // 50 + "..."
      expect(result.endsWith("...")).toBe(true);
    });

    it("should not truncate short text", () => {
      const shortText = "short text";
      const result = stripMarkdown(shortText, 50);

      expect(result).toBe("short text");
      expect(result.endsWith("...")).toBe(false);
    });

    it("should trim before truncating", () => {
      const text = "   text   ";
      const result = stripMarkdown(text, 10);

      expect(result.startsWith(" ")).toBe(false);
      expect(result.endsWith(" ")).toBe(false);
    });
  });

  describe("MemoCard plain text display", () => {
    it("should show plain text preview without markdown", () => {
      // Simulating MemoCard preview behavior
      const content = "**Important** meeting notes";
      const preview = stripMarkdown(content, 100);

      expect(preview).toBe("Important meeting notes");
      expect(preview).not.toContain("**");
    });

    it("should handle markdown links in preview", () => {
      const content = "See [documentation](https://example.com) for details";
      const preview = stripMarkdown(content, 100);

      expect(preview).toBe("See documentation for details");
      expect(preview).not.toContain("](");
    });

    it("should handle code blocks in preview", () => {
      const content = "Example:\n```javascript\nconst x = 1;\n```\nDone";
      const preview = stripMarkdown(content, 100);

      expect(preview).toBe("Example: const x = 1; Done");
      expect(preview).not.toContain("```");
    });
  });

  describe("MemoListItem plain text display", () => {
    it("should show truncated plain text in list item", () => {
      const content = "# " + "Long content ".repeat(20);
      const preview = stripMarkdown(content, 100);

      expect(preview.length).toBeLessThanOrEqual(103); // 100 + "..."
      expect(preview).not.toContain("#");
    });

    it("should handle mixed content in list preview", () => {
      const content = "# Title\n\n- Item 1\n- Item 2\n\n**Bold text**";
      const preview = stripMarkdown(content, 100);

      expect(preview).not.toContain("#");
      expect(preview).not.toContain("**");
      expect(preview).not.toContain("- Item");
    });
  });

  describe("Edge cases", () => {
    it("should handle nested markdown", () => {
      const result = stripMarkdown("**_bold and italic_**");
      expect(result).toBe("bold and italic");
    });

    it("should handle markdown at end of text", () => {
      const result = stripMarkdown("Text with **bold at end**");
      expect(result).toBe("Text with bold at end");
    });

    it("should handle markdown at start of text", () => {
      const result = stripMarkdown("**Start bold** then normal");
      expect(result).toBe("Start bold then normal");
    });

    it("should handle consecutive markdown elements", () => {
      const result = stripMarkdown("**bold**`code`*italic*");
      expect(result).toBe("boldcodeitalic");
    });

    it("should preserve spaces between words", () => {
      const result = stripMarkdown("**bold** and *italic*");
      expect(result).toBe("bold and italic");
    });

    it("should normalize multiple spaces", () => {
      const result = stripMarkdown("word     word");
      expect(result).toBe("word word");
    });

    it("should handle horizontal rules", () => {
      const result = stripMarkdown("Text before\n---\nText after");
      expect(result).toBe("Text before Text after");
    });
  });

  describe("Unicode and special characters", () => {
    it("should preserve unicode characters", () => {
      const result = stripMarkdown("**한글** and *日本語*");
      expect(result).toBe("한글 and 日本語");
    });

    it("should handle emoji in markdown", () => {
      const result = stripMarkdown("**🎉 Party!**");
      expect(result).toBe("🎉 Party!");
    });

    it("should handle special regex characters", () => {
      const result = stripMarkdown("Text with $special [chars] (parens)");
      expect(result).toContain("special");
      expect(result).toContain("chars");
    });
  });

  describe("Real-world content examples", () => {
    it("should handle lecture notes format", () => {
      const content = `# Lecture 1: Introduction

## Key Concepts
- Concept A
- Concept B

**Important**: Remember to review!

\`\`\`python
def example():
    return 42
\`\`\`
`;
      const result = stripMarkdown(content, 150);

      expect(result).not.toContain("#");
      expect(result).not.toContain("```");
      expect(result).not.toContain("**");
    });

    it("should handle meeting minutes format", () => {
      const content = `# Meeting Notes - 2024-01-15

**Attendees**: Alice, Bob

## Action Items
1. Review [proposal](link)
2. Schedule follow-up
`;
      const result = stripMarkdown(content, 100);

      expect(result).not.toContain("#");
      expect(result).not.toContain("](");
    });
  });
});
