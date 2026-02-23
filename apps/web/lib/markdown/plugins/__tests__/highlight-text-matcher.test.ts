/**
 * Tests for highlight-text-matcher
 * REQ-FE-009: HAST text node matching for Q&A highlights
 *
 * TDD: RED phase - write failing tests first
 */

import { describe, it, expect } from "vitest";
import type { Element, Text as HastText, Properties } from "hast";
import {
  findTextInNodes,
  wrapMatchWithMark,
  type TextMatch,
} from "../highlight-text-matcher";

// Helper to create a HAST text node
function text(value: string): HastText {
  return { type: "text", value };
}

// Helper to create a HAST element node
function element(
  tagName: string,
  children: (HastText | Element)[] = [],
  properties: Properties = {}
): Element {
  return { type: "element", tagName, properties, children };
}

describe("findTextInNodes", () => {
  it("should find exact match in a single text node", () => {
    const nodes = [text("Hello world, this is a test.")];
    const result = findTextInNodes(nodes, "this is a test");

    expect(result).not.toBeNull();
    expect(result!.nodeIndex).toBe(0);
    expect(result!.matchStart).toBe(13);
    expect(result!.matchEnd).toBe(27);
  });

  it("should return null when text is not found", () => {
    const nodes = [text("Hello world.")];
    const result = findTextInNodes(nodes, "not here");

    expect(result).toBeNull();
  });

  it("should find text in second text node", () => {
    const nodes = [
      text("First paragraph. "),
      text("Second paragraph with target text."),
    ];
    const result = findTextInNodes(nodes, "target text");

    expect(result).not.toBeNull();
    expect(result!.nodeIndex).toBe(1);
  });

  it("should return null for empty search text", () => {
    const nodes = [text("Hello world.")];
    const result = findTextInNodes(nodes, "");

    expect(result).toBeNull();
  });

  it("should return null for empty nodes array", () => {
    const result = findTextInNodes([], "test");
    expect(result).toBeNull();
  });

  it("should skip non-text nodes and search only text nodes", () => {
    const nodes: (HastText | Element)[] = [
      text("before "),
      element("strong", [text("bold")]),
      text(" after target here"),
    ];
    const result = findTextInNodes(nodes, "target here");

    expect(result).not.toBeNull();
    expect(result!.nodeIndex).toBe(2);
  });

  it("should handle very long search text (500 chars)", () => {
    const longText = "a".repeat(500);
    const nodes = [text(`prefix ${longText} suffix`)];
    const result = findTextInNodes(nodes, longText);

    expect(result).not.toBeNull();
    expect(result!.matchStart).toBe(7);
    expect(result!.matchEnd).toBe(507);
  });
});

describe("wrapMatchWithMark", () => {
  it("should wrap matched portion with mark element", () => {
    const node = text("Hello world, this is a test.");
    const match: TextMatch = { nodeIndex: 0, matchStart: 13, matchEnd: 27 };
    const attrs = {
      "data-highlight-id": "h1",
      "data-question-count": "2",
      "data-status": "OPEN",
    };

    const result = wrapMatchWithMark(node, match.matchStart, match.matchEnd, attrs);

    // Should produce: [text("Hello world, "), mark(text("this is a test")), text(".")]
    expect(result).toHaveLength(3);

    // Before text
    expect(result[0]).toMatchObject({ type: "text", value: "Hello world, " });

    // Mark element
    const mark = result[1] as Element;
    expect(mark.type).toBe("element");
    expect(mark.tagName).toBe("mark");
    expect(mark.properties).toMatchObject(attrs);
    expect(mark.children).toHaveLength(1);
    expect((mark.children[0] as HastText).value).toBe("this is a test");

    // After text
    expect(result[2]).toMatchObject({ type: "text", value: "." });
  });

  it("should handle match at start of text", () => {
    const node = text("Hello world.");
    const result = wrapMatchWithMark(node, 0, 5, { "data-highlight-id": "h1" });

    // Should produce: [mark(text("Hello")), text(" world.")]
    expect(result).toHaveLength(2);
    expect((result[0] as Element).tagName).toBe("mark");
    expect(result[1]).toMatchObject({ type: "text", value: " world." });
  });

  it("should handle match at end of text", () => {
    const node = text("Hello world.");
    const result = wrapMatchWithMark(node, 6, 12, { "data-highlight-id": "h1" });

    // Should produce: [text("Hello "), mark(text("world."))]
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ type: "text", value: "Hello " });
    expect((result[1] as Element).tagName).toBe("mark");
  });

  it("should handle match covering entire text", () => {
    const node = text("Hello");
    const result = wrapMatchWithMark(node, 0, 5, { "data-highlight-id": "h1" });

    // Should produce: [mark(text("Hello"))]
    expect(result).toHaveLength(1);
    expect((result[0] as Element).tagName).toBe("mark");
  });
});
