/**
 * Tests for Markdown Processing Utilities
 * REQ-FE-307: Unit tests for markdown utilities
 */

import { describe, it, expect } from "vitest";
import {
  extractHeadings,
  extractTextContent,
  estimateReadingTime,
  sanitizeMarkdown,
} from "../index";

describe("extractHeadings", () => {
  it("should extract h2, h3, h4 headings", () => {
    const content = `
# H1 (ignored)
## Heading 2
### Heading 3
#### Heading 4
##### H5 (ignored)
    `;

    const headings = extractHeadings(content);

    expect(headings).toHaveLength(1);
    expect(headings[0]?.id).toBe("heading-2");
    expect(headings[0]?.text).toBe("Heading 2");
    expect(headings[0]?.children[0]?.id).toBe("heading-3");
    expect(headings[0]?.children[0]?.children[0]?.id).toBe("heading-4");
  });

  it("should handle multiple top-level headings", () => {
    const content = `
## First Section
Some content
## Second Section
### Sub-heading
## Third Section
    `;

    const headings = extractHeadings(content);

    expect(headings).toHaveLength(3);
    expect(headings[0]?.text).toBe("First Section");
    expect(headings[1]?.text).toBe("Second Section");
    expect(headings[1]?.children).toHaveLength(1);
    expect(headings[2]?.text).toBe("Third Section");
  });

  it("should generate valid slugs", () => {
    const content = `
## Hello World!
## Special @#$ Characters
## Multiple   Spaces
    `;

    const headings = extractHeadings(content);

    expect(headings[0]?.id).toBe("hello-world");
    expect(headings[1]?.id).toBe("special-characters");
    expect(headings[2]?.id).toBe("multiple-spaces");
  });

  it("should return empty array for no headings", () => {
    const content = "No headings here, just text.";
    const headings = extractHeadings(content);
    expect(headings).toHaveLength(0);
  });

  it("should handle empty content", () => {
    const headings = extractHeadings("");
    expect(headings).toHaveLength(0);
  });
});

describe("extractTextContent", () => {
  it("should remove heading markers", () => {
    const content = "## Heading 2\n### Heading 3";
    const text = extractTextContent(content);
    expect(text).toBe("Heading 2 Heading 3");
  });

  it("should remove links but keep text", () => {
    const content = "Check out [this link](https://example.com) here.";
    const text = extractTextContent(content);
    expect(text).toBe("Check out this link here.");
  });

  it("should remove images", () => {
    const content = "Before ![alt text](image.png) after.";
    const text = extractTextContent(content);
    expect(text).toBe("Before after.");
  });

  it("should remove formatting", () => {
    const content = "This is **bold** and *italic* and ~~strikethrough~~.";
    const text = extractTextContent(content);
    expect(text).toBe("This is bold and italic and strikethrough.");
  });

  it("should remove code blocks", () => {
    const content = "Before\n```js\nconst x = 1;\n```\nAfter";
    const text = extractTextContent(content);
    expect(text).toBe("Before After");
  });

  it("should remove inline code", () => {
    const content = "Use the `console.log()` function.";
    const text = extractTextContent(content);
    expect(text).toBe("Use the function.");
  });

  it("should remove list markers", () => {
    const content = "- Item 1\n- Item 2\n1. Numbered\n2. List";
    const text = extractTextContent(content);
    expect(text).toBe("Item 1 Item 2 Numbered List");
  });

  it("should remove blockquotes", () => {
    const content = "> This is a quote";
    const text = extractTextContent(content);
    expect(text).toBe("This is a quote");
  });

  it("should remove math expressions", () => {
    const content = "Inline $x = y$ and block $$x^2$$";
    const text = extractTextContent(content);
    expect(text).toBe("Inline and block");
  });

  it("should handle complex content", () => {
    const content = `
# Main Heading

This is a paragraph with **bold**, *italic*, and \`code\`.

## Section 1

- List item 1
- List item 2

[Link](https://example.com)

\`\`\`js
const code = "block";
\`\`\`

> [!NOTE]
> This is a callout
    `;

    const text = extractTextContent(content);
    expect(text).toContain("Main Heading");
    expect(text).toContain("paragraph with bold, italic");
    expect(text).toContain("Section 1");
    expect(text).toContain("List item 1");
    expect(text).not.toContain("[Link](https://example.com)");
    expect(text).toContain("Link");
    expect(text).not.toContain("const code");
    expect(text).not.toContain("[!NOTE]");
  });
});

describe("estimateReadingTime", () => {
  it("should return minimum 1 minute for short content", () => {
    const content = "Just a few words.";
    const time = estimateReadingTime(content);
    expect(time).toBe(1);
  });

  it("should calculate based on 200 wpm", () => {
    // 200 words = 1 minute
    const words = Array(200).fill("word").join(" ");
    const time = estimateReadingTime(words);
    expect(time).toBe(1);
  });

  it("should round up to next minute", () => {
    // 201 words = 2 minutes (rounded up)
    const words = Array(201).fill("word").join(" ");
    const time = estimateReadingTime(words);
    expect(time).toBe(2);
  });

  it("should handle markdown syntax (ignore it)", () => {
    const content = `
## Heading
This is **bold** and *italic* text.
- List item
[Link](url)
    `;

    const time = estimateReadingTime(content);
    expect(time).toBe(1);
  });

  it("should handle empty content", () => {
    const time = estimateReadingTime("");
    expect(time).toBe(1);
  });
});

describe("sanitizeMarkdown", () => {
  it("should remove script tags", () => {
    const content = 'Before <script>alert("xss")</script> after';
    const sanitized = sanitizeMarkdown(content);
    // Script tags and their content are completely removed for security
    expect(sanitized).toBe("Before  after");
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("alert");
  });

  it("should remove style tags", () => {
    const content = "<style>body{color:red;}</style>Content";
    const sanitized = sanitizeMarkdown(content);
    expect(sanitized).toBe("Content");
  });

  it("should remove javascript: URLs", () => {
    const content = '[Link](javascript:alert("xss"))';
    const sanitized = sanitizeMarkdown(content);
    expect(sanitized).not.toContain("javascript:");
  });

  it("should remove event handlers", () => {
    const content = '<div onclick="alert(1)">Content</div>';
    const sanitized = sanitizeMarkdown(content);
    expect(sanitized).not.toContain("onclick");
  });

  it("should remove iframe tags", () => {
    const content = '<iframe src="evil.com"></iframe>Content';
    const sanitized = sanitizeMarkdown(content);
    expect(sanitized).not.toContain("<iframe");
  });

  it("should remove object/embed tags", () => {
    const content = '<object data="evil.swf"></object><embed src="evil.swf">';
    const sanitized = sanitizeMarkdown(content);
    expect(sanitized).not.toContain("<object");
    expect(sanitized).not.toContain("<embed");
  });

  it("should remove form tags", () => {
    const content = '<form action="evil.com"><input type="text"></form>';
    const sanitized = sanitizeMarkdown(content);
    expect(sanitized).not.toContain("<form");
    expect(sanitized).not.toContain("<input");
  });

  it("should remove data: URLs", () => {
    const content = '![image](data:image/svg+xml,<svg onload="alert(1)">';
    const sanitized = sanitizeMarkdown(content);
    expect(sanitized).not.toContain("data:");
  });

  it("should preserve safe content", () => {
    const content = `
# Heading

This is **bold** and *italic*.

[Link](https://example.com)

\`\`\`js
const code = "safe";
\`\`\`

- List item 1
- List item 2
    `;

    const sanitized = sanitizeMarkdown(content);
    expect(sanitized).toContain("# Heading");
    expect(sanitized).toContain("**bold**");
    expect(sanitized).toContain("*italic*");
    expect(sanitized).toContain("https://example.com");
    expect(sanitized).toContain("const code");
  });

  it("should handle empty content", () => {
    const sanitized = sanitizeMarkdown("");
    expect(sanitized).toBe("");
  });

  it("should trim whitespace", () => {
    const content = "  Content  ";
    const sanitized = sanitizeMarkdown(content);
    expect(sanitized).toBe("Content");
  });
});
