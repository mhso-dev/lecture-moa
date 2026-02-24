/**
 * HAST Text Node Matching Utilities for Q&A Highlights
 * REQ-FE-009: Pure utility functions for finding and wrapping text in HAST trees
 *
 * These functions operate on HAST (Hypertext Abstract Syntax Tree) nodes
 * to locate selectedText from Q&A questions and wrap them with <mark> elements.
 */

import type { Element, Text as HastText, ElementContent } from "hast";

/**
 * Result of a text search within HAST nodes
 */
export interface TextMatch {
  /** Index of the text node within the flat node array */
  nodeIndex: number;
  /** Character offset where the match starts within the text node */
  matchStart: number;
  /** Character offset where the match ends within the text node */
  matchEnd: number;
}

/**
 * Search through an array of HAST nodes (text and element) to find
 * the first text node containing the search text.
 *
 * Only searches direct text node children; does not recurse into elements.
 * Returns null if no match is found (graceful degradation).
 *
 * @param nodes - Array of HAST child nodes to search
 * @param searchText - The text to find (exact substring match)
 * @returns TextMatch with position data, or null if not found
 */
export function findTextInNodes(
  nodes: ElementContent[],
  searchText: string
): TextMatch | null {
  if (!searchText || nodes.length === 0) {
    return null;
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node?.type !== "text") {
      continue;
    }

    const textNode = node;
    const idx = textNode.value.indexOf(searchText);
    if (idx !== -1) {
      return {
        nodeIndex: i,
        matchStart: idx,
        matchEnd: idx + searchText.length,
      };
    }
  }

  return null;
}

/**
 * Split a text node at the match boundaries and wrap the matched portion
 * with a <mark> element containing the given attributes.
 *
 * Produces an array of 1-3 nodes:
 * - [mark] if the match covers the entire text
 * - [text, mark] if the match starts at the beginning
 * - [mark, text] if the match ends at the end
 * - [text, mark, text] if the match is in the middle
 *
 * @param textNode - The HAST text node containing the match
 * @param matchStart - Start character offset of the match
 * @param matchEnd - End character offset of the match
 * @param attrs - HTML attributes to set on the <mark> element
 * @returns Array of HAST nodes replacing the original text node
 */
export function wrapMatchWithMark(
  textNode: HastText,
  matchStart: number,
  matchEnd: number,
  attrs: Record<string, string>
): ElementContent[] {
  const value = textNode.value;
  const before = value.slice(0, matchStart);
  const matched = value.slice(matchStart, matchEnd);
  const after = value.slice(matchEnd);

  const markNode: Element = {
    type: "element",
    tagName: "mark",
    properties: { ...attrs },
    children: [{ type: "text", value: matched }],
  };

  const result: ElementContent[] = [];

  if (before) {
    result.push({ type: "text", value: before });
  }

  result.push(markNode);

  if (after) {
    result.push({ type: "text", value: after });
  }

  return result;
}
