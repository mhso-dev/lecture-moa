/**
 * Rehype plugin: Q&A Highlight Injection
 * REQ-FE-009: Transforms HAST tree to wrap highlighted text with <mark> elements
 *
 * This plugin runs at the HAST (HTML AST) level BEFORE React rendering.
 * It groups highlights by headingId, walks the tree tracking sections,
 * and wraps matching selectedText with <mark> elements carrying data attributes.
 *
 * @MX:ANCHOR: [AUTO] Core rehype plugin for Q&A highlight rendering
 * @MX:REASON: Used by MarkdownRenderer (fan_in >= 3: MarkdownRenderer, tests, material page)
 * @MX:SPEC: SPEC-FE-009
 */

import type { Root, Element, Text as HastText } from "hast";
import type { QAHighlightData } from "@shared";
import { SlugCounter } from "../utils/slug";
import { findTextInNodes, wrapMatchWithMark } from "./highlight-text-matcher";

/**
 * Plugin options
 */
export interface RehypeQAHighlightsOptions {
  highlights: QAHighlightData[];
}

/**
 * Tags whose descendants should be skipped when searching for text to highlight.
 * Includes code blocks, links, and math expressions.
 */
const SKIP_TAGS = new Set(["pre", "code", "a"]);

/**
 * CSS class names whose parent elements should be skipped.
 */
const SKIP_CLASSES = new Set([
  "katex",
  "math-inline",
  "math-display",
]);

/**
 * Status priority for merged highlights (higher index = higher priority)
 */
const STATUS_PRIORITY: Record<string, number> = {
  CLOSED: 0,
  RESOLVED: 1,
  OPEN: 2,
};

/**
 * Group of highlights sharing the same selectedText within a section.
 * Used to merge multiple questions into a single <mark> element.
 */
interface HighlightGroup {
  ids: string[];
  selectedText: string;
  status: string;
  count: number;
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Check if a HAST element should be skipped based on tag name or class.
 */
function shouldSkipElement(node: Element): boolean {
  if (SKIP_TAGS.has(node.tagName)) {
    return true;
  }

  const className = node.properties.className;
  if (Array.isArray(className)) {
    for (const cls of className) {
      if (typeof cls === "string" && SKIP_CLASSES.has(cls)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extract plain text content from a heading element for slug generation.
 */
function extractHeadingText(heading: Element): string {
  let result = "";
  for (const child of heading.children) {
    if (child.type === "text") {
      result += child.value;
    } else if (child.type === "element") {
      result += extractHeadingText(child);
    }
  }
  return result;
}

/**
 * Group highlights by selectedText within a section, merging duplicates.
 * Returns groups with comma-separated IDs and highest-priority status.
 */
function groupHighlightsByText(
  highlights: QAHighlightData[]
): HighlightGroup[] {
  const groups = new Map<string, HighlightGroup>();

  for (const h of highlights) {
    if (!h.selectedText) continue;

    const existing = groups.get(h.selectedText);
    if (existing) {
      existing.ids.push(h.id);
      existing.count += 1;
      // Use highest priority status
      if (
        (STATUS_PRIORITY[h.status] ?? 0) >
        (STATUS_PRIORITY[existing.status] ?? 0)
      ) {
        existing.status = h.status;
      }
    } else {
      groups.set(h.selectedText, {
        ids: [h.id],
        selectedText: h.selectedText,
        status: h.status,
        count: 1,
      });
    }
  }

  return Array.from(groups.values());
}

/**
 * Check if a tag name is a heading element (h1-h6).
 */
function isHeading(tagName: string): boolean {
  return /^h[1-6]$/.test(tagName);
}

/**
 * Apply highlight groups to an element's text nodes (recursive).
 * Mutates the element's children array in-place.
 */
function applyHighlightsToElement(
  element: Element,
  groups: HighlightGroup[]
): void {
  if (shouldSkipElement(element)) return;
  if (groups.length === 0) return;

  // Process children in reverse order so index mutations don't affect later iterations
  for (let i = element.children.length - 1; i >= 0; i--) {
    const child = element.children[i];
    if (!child) continue;

    if (child.type === "element") {
      applyHighlightsToElement(child, groups);
    }
  }

  // Now try to match text nodes directly in this element
  for (const group of groups) {
    const match = findTextInNodes(element.children, group.selectedText);
    if (!match) continue;

    const textNode = element.children[match.nodeIndex] as HastText;
    const attrs: Record<string, string> = {
      dataHighlightId: group.ids.join(","),
      dataQuestionCount: String(group.count),
      dataStatus: group.status,
    };

    const replacement = wrapMatchWithMark(
      textNode,
      match.matchStart,
      match.matchEnd,
      attrs
    );

    // Replace the original text node with the split nodes
    element.children.splice(match.nodeIndex, 1, ...replacement);
  }
}

// ── Plugin ─────────────────────────────────────────────────

/**
 * Rehype plugin that injects Q&A highlight <mark> elements into the HAST tree.
 *
 * Algorithm:
 * 1. Group highlights by headingId
 * 2. Walk HAST tree, track current section by heading elements
 * 3. For headings: compute slug using shared SlugCounter
 * 4. For each section, find and wrap matching selectedText with <mark>
 * 5. Skip nodes inside: pre, code, a, .katex, .math-inline, .math-display
 * 6. Set attributes: data-highlight-id, data-question-count, data-status
 * 7. For highlights with null headingId, search entire document
 * 8. Entire plugin wrapped in try/catch for graceful degradation
 */
export function rehypeQAHighlights(
  options: RehypeQAHighlightsOptions
): (tree: Root) => void {
  const { highlights } = options;

  return (tree: Root): void => {
    try {
      if (highlights.length === 0) return;

      // Group highlights by headingId
      const bySection = new Map<string | null, QAHighlightData[]>();
      for (const h of highlights) {
        const key = h.headingId;
        const existing = bySection.get(key) ?? [];
        existing.push(h);
        bySection.set(key, existing);
      }

      // Slug counter for computing heading IDs (must match MarkdownRenderer)
      const slugCounter = new SlugCounter();

      // Track current section slug as we walk top-level children
      let currentSectionSlug: string | null = null;

      // Collect elements per section for processing
      const sectionElements = new Map<string | null, Element[]>();

      for (const child of tree.children) {
        if (child.type !== "element") continue;

        if (isHeading(child.tagName)) {
          const headingText = extractHeadingText(child);
          currentSectionSlug = slugCounter.generateUniqueSlug(headingText);
        } else {
          // Add this element to the current section's list
          if (!sectionElements.has(currentSectionSlug)) {
            sectionElements.set(currentSectionSlug, []);
          }
          sectionElements.get(currentSectionSlug)?.push(child);
        }
      }

      // Apply section-specific highlights
      for (const [sectionSlug, sectionHighlights] of bySection) {
        if (sectionSlug === null) {
          // null headingId: search entire document
          const groups = groupHighlightsByText(sectionHighlights);
          for (const elements of sectionElements.values()) {
            for (const element of elements) {
              applyHighlightsToElement(element, groups);
            }
          }
        } else {
          // Specific section
          const elements = sectionElements.get(sectionSlug);
          if (!elements) continue;

          const groups = groupHighlightsByText(sectionHighlights);
          for (const element of elements) {
            applyHighlightsToElement(element, groups);
          }
        }
      }
    } catch {
      // Graceful degradation: return tree unchanged on any error
      return;
    }
  };
}
