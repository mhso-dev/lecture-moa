/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Tests for rehype-qa-highlights
 * REQ-FE-009: Rehype plugin that injects <mark> highlights into HAST
 *
 * TDD: RED phase - write failing tests first
 *
 * Tests use direct HAST tree construction instead of unified pipeline
 * because remark-parse/rehype-stringify are bundled inside react-markdown.
 */

import { describe, it, expect } from "vitest";
import type { Root, Element, Text as HastText, Properties } from "hast";
import type { QAHighlightData } from "@shared";
import { rehypeQAHighlights } from "../rehype-qa-highlights";

// ── HAST tree helpers ──────────────────────────────────────

function text(value: string): HastText {
  return { type: "text", value };
}

function el(
  tagName: string,
  children: (HastText | Element)[] = [],
  properties: Properties = {}
): Element {
  return { type: "element", tagName, properties, children };
}

/** Build a minimal HAST root */
function root(...children: (HastText | Element)[]): Root {
  return { type: "root", children };
}

/** Build a heading element with text content */
function heading(level: number, content: string): Element {
  return el(`h${String(level)}`, [text(content)]);
}

/** Build a paragraph element with text content */
function p(content: string): Element {
  return el("p", [text(content)]);
}

/** Extract the plugin transformer from rehypeQAHighlights */
function applyPlugin(tree: Root, highlights: QAHighlightData[]): Root {
  // rehypeQAHighlights returns a transformer function
  const transformer = rehypeQAHighlights({ highlights });
  // The transformer mutates the tree in-place and returns void or the tree
  transformer(tree);
  return tree;
}

/** Find all <mark> elements in a HAST tree (recursive) */
function findMarks(node: Root | Element): Element[] {
  const marks: Element[] = [];
  for (const child of node.children) {
    if (child.type === "element") {
      if (child.tagName === "mark") {
        marks.push(child);
      }
      marks.push(...findMarks(child));
    }
  }
  return marks;
}

// ── Tests ──────────────────────────────────────────────────

describe("rehypeQAHighlights", () => {
  describe("basic highlight injection", () => {
    it("should wrap matched text with <mark> element and data attributes", () => {
      const tree = root(
        heading(2, "Introduction"),
        p("This is important text in the section.")
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "important text",
          headingId: "introduction",
          status: "OPEN",
          title: "Question about importance",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(1);

      const mark = marks[0]!;
      expect(mark.properties.dataHighlightId).toBe("q1");
      expect(mark.properties.dataStatus).toBe("OPEN");
      expect(mark.properties.dataQuestionCount).toBe("1");

      // Check the marked text content
      const markText = mark.children[0] as HastText;
      expect(markText.value).toBe("important text");
    });

    it("should set data-question-count when multiple highlights share the same text", () => {
      const tree = root(
        heading(2, "Section"),
        p("Shared target text here.")
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "Shared target text",
          headingId: "section",
          status: "OPEN",
          title: "First question",
        },
        {
          id: "q2",
          selectedText: "Shared target text",
          headingId: "section",
          status: "RESOLVED",
          title: "Second question",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(1);
      expect(marks[0]!.properties.dataQuestionCount).toBe("2");
      // Comma-separated IDs
      expect(marks[0]!.properties.dataHighlightId).toBe("q1,q2");
    });

    it("should use highest-priority status when highlights share text (OPEN > RESOLVED > CLOSED)", () => {
      const tree = root(
        heading(2, "Section"),
        p("Target text here.")
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "Target text",
          headingId: "section",
          status: "RESOLVED",
          title: "Resolved question",
        },
        {
          id: "q2",
          selectedText: "Target text",
          headingId: "section",
          status: "OPEN",
          title: "Open question",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(1);
      // OPEN takes priority over ANSWERED
      expect(marks[0]!.properties.dataStatus).toBe("OPEN");
    });
  });

  describe("section-based matching", () => {
    it("should only match text within the correct heading section", () => {
      const tree = root(
        heading(2, "Section A"),
        p("Target text in A."),
        heading(2, "Section B"),
        p("Target text in B.")
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "Target text",
          headingId: "section-b",
          status: "OPEN",
          title: "Question in B",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(1);

      // The mark should appear in the second paragraph (Section B)
      const secondP = tree.children[3] as Element;
      const pMarks = findMarks(secondP);
      expect(pMarks).toHaveLength(1);

      // First paragraph should have no marks
      const firstP = tree.children[1] as Element;
      expect(findMarks(firstP)).toHaveLength(0);
    });

    it("should match highlights with null headingId anywhere in the document", () => {
      const tree = root(
        heading(2, "Section A"),
        p("Some unique text here."),
        heading(2, "Section B"),
        p("Other content.")
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "unique text",
          headingId: null,
          status: "OPEN",
          title: "Global question",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(1);
      expect(marks[0]!.properties.dataHighlightId).toBe("q1");
    });

    it("should handle content before first heading (null section)", () => {
      const tree = root(
        p("Intro text before any heading."),
        heading(2, "First Section"),
        p("Section content.")
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "Intro text",
          headingId: null,
          status: "OPEN",
          title: "Intro question",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(1);
    });
  });

  describe("skip rules", () => {
    it("should not highlight text inside <code> elements", () => {
      const tree = root(
        heading(2, "Section"),
        el("p", [
          el("code", [text("target text")]),
          text(" and target text outside"),
        ])
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "target text",
          headingId: "section",
          status: "OPEN",
          title: "Code question",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      // Should only match the text node outside <code>
      expect(marks).toHaveLength(1);

      // Verify the code element is untouched
      const paragraph = tree.children[1] as Element;
      const codeEl = paragraph.children[0] as Element;
      expect(codeEl.tagName).toBe("code");
      expect(findMarks(codeEl)).toHaveLength(0);
    });

    it("should not highlight text inside <pre> elements", () => {
      const tree = root(
        heading(2, "Section"),
        p("target text outside"),
        el("pre", [el("code", [text("target text inside code block")])])
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "target text",
          headingId: "section",
          status: "OPEN",
          title: "Pre question",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(1);

      // pre should have no marks
      const preEl = tree.children[2] as Element;
      expect(findMarks(preEl)).toHaveLength(0);
    });

    it("should not highlight text inside <a> elements", () => {
      const tree = root(
        heading(2, "Section"),
        el("p", [
          el("a", [text("target text")], { href: "https://example.com" }),
          text(" and target text outside"),
        ])
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "target text",
          headingId: "section",
          status: "OPEN",
          title: "Link question",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(1);

      // Link should have no marks
      const paragraph = tree.children[1] as Element;
      const aEl = paragraph.children[0] as Element;
      expect(findMarks(aEl)).toHaveLength(0);
    });

    it("should not highlight text inside elements with katex class", () => {
      const tree = root(
        heading(2, "Section"),
        el("p", [
          el("span", [text("target text")], { className: ["katex"] }),
          text(" and target text outside"),
        ])
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "target text",
          headingId: "section",
          status: "OPEN",
          title: "Math question",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(1);

      // Katex span should have no marks
      const paragraph = tree.children[1] as Element;
      const katexEl = paragraph.children[0] as Element;
      expect(findMarks(katexEl)).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should return tree unchanged when highlights array is empty", () => {
      const tree = root(heading(2, "Section"), p("Some text."));
      const original = JSON.stringify(tree);

      applyPlugin(tree, []);

      // Tree should be identical
      expect(JSON.stringify(tree)).toBe(original);
    });

    it("should return tree unchanged when highlight text is not found", () => {
      const tree = root(heading(2, "Section"), p("Some text."));

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "nonexistent text",
          headingId: "section",
          status: "OPEN",
          title: "Missing text",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(0);
    });

    it("should handle multiple highlights in different sections", () => {
      const tree = root(
        heading(2, "First"),
        p("Alpha text here."),
        heading(2, "Second"),
        p("Beta text here.")
      );

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "Alpha text",
          headingId: "first",
          status: "OPEN",
          title: "First question",
        },
        {
          id: "q2",
          selectedText: "Beta text",
          headingId: "second",
          status: "RESOLVED",
          title: "Second question",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(2);

      expect(marks[0]!.properties.dataHighlightId).toBe("q1");
      expect(marks[1]!.properties.dataHighlightId).toBe("q2");
    });

    it("should handle empty selectedText gracefully (skip it)", () => {
      const tree = root(heading(2, "Section"), p("Some text."));

      const highlights: QAHighlightData[] = [
        {
          id: "q1",
          selectedText: "",
          headingId: "section",
          status: "OPEN",
          title: "Empty text",
        },
      ];

      applyPlugin(tree, highlights);

      const marks = findMarks(tree);
      expect(marks).toHaveLength(0);
    });

    it("should not throw errors and return tree unchanged on unexpected input", () => {
      const tree = root(heading(2, "Section"), p("Some text."));

      // Even with null/undefined in unexpected places, should not throw
      expect(() => {
        applyPlugin(tree, [
          {
            id: "q1",
            selectedText: "text",
            headingId: "nonexistent-section",
            status: "OPEN",
            title: "Missing section",
          },
        ]);
      }).not.toThrow();
    });
  });
});
