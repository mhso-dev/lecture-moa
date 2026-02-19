/**
 * Markdown Processing Utilities
 * REQ-FE-307: Pure functions for Markdown processing operations
 *
 * All functions are pure (no React dependencies), usable in both client and server contexts
 */

import type { TocItem } from "@shared";

/**
 * Generate a URL-friendly slug from heading text
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars except word chars, spaces, hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Extract headings from Markdown content for ToC generation
 * REQ-FE-307: Parse h2, h3, h4 headings and return nested TocItem structure
 *
 * @param content - Raw Markdown content
 * @returns Array of TocItem with nested children
 */
export function extractHeadings(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const matches: Array<{ level: 2 | 3 | 4; text: string; slug: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1]?.length as 2 | 3 | 4;
    const text = (match[2] ?? "").trim();
    const slug = generateSlug(text);

    matches.push({ level, text, slug });
  }

  // Build nested structure
  const result: TocItem[] = [];
  const stack: Array<{ item: TocItem; level: number }> = [];

  for (const heading of matches) {
    const item: TocItem = {
      id: heading.slug,
      level: heading.level,
      text: heading.text,
      children: [],
    };

    // Find parent in stack
    const stackTop = stack[stack.length - 1];
    while (stack.length > 0 && stackTop && stackTop.level >= heading.level) {
      stack.pop();
    }

    const currentTop = stack[stack.length - 1];
    if (stack.length === 0 || !currentTop) {
      // Top-level item
      result.push(item);
    } else {
      // Nested item
      currentTop.item.children.push(item);
    }

    stack.push({ item, level: heading.level });
  }

  return result;
}

/**
 * Strip Markdown syntax to get plain text
 * REQ-FE-307: Remove heading markers, links, formatting, code blocks
 *
 * @param content - Raw Markdown content
 * @returns Plain text without Markdown syntax
 */
export function extractTextContent(content: string): string {
  let text = content;

  // Remove code blocks (fenced)
  text = text.replace(/```[\s\S]*?```/g, "");

  // Remove inline code
  text = text.replace(/`[^`]+`/g, "");

  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove headings
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // Remove strikethrough
  text = text.replace(/~~([^~]+)~~/g, "$1");

  // Remove blockquotes
  text = text.replace(/^>\s+/gm, "");

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");

  // Remove list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");
  text = text.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove task list markers
  text = text.replace(/\[[ x]\]\s*/gi, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Remove math blocks
  text = text.replace(/\$\$[\s\S]*?\$\$/g, "");
  text = text.replace(/\$[^$]+\$/g, "");

  // Remove callout markers
  text = text.replace(/\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*/gi, "");

  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, "\n");
  text = text.replace(/\s+/g, " ");

  return text.trim();
}

/**
 * Estimate reading time (words / 200 wpm)
 * REQ-FE-307: Count words, divide by 200, return minutes (minimum 1)
 *
 * @param content - Raw Markdown content
 * @returns Estimated reading time in minutes (minimum 1)
 */
export function estimateReadingTime(content: string): number {
  const plainText = extractTextContent(content);

  // Count words (split by whitespace)
  const words = plainText.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  // 200 words per minute
  const minutes = Math.ceil(wordCount / 200);

  // Minimum 1 minute
  return Math.max(1, minutes);
}

/**
 * Basic input sanitization before storage
 * REQ-FE-307: Remove potentially dangerous content
 *
 * @param content - Raw Markdown content
 * @returns Sanitized content safe for storage
 */
export function sanitizeMarkdown(content: string): string {
  let sanitized = content;

  // Remove script tags (both HTML and Markdown variants)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  sanitized = sanitized.replace(/<script[^>]*>/gi, "");

  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, "");

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove data: URLs (potential XSS vector)
  sanitized = sanitized.replace(/data\s*:/gi, "");

  // Remove vbscript: URLs
  sanitized = sanitized.replace(/vbscript\s*:/gi, "");

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  sanitized = sanitized.replace(/<iframe[^>]*\/?>/gi, "");

  // Remove object/embed tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  sanitized = sanitized.replace(/<embed[^>]*\/?>/gi, "");

  // Remove form tags
  sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "");
  sanitized = sanitized.replace(/<input[^>]*\/?>/gi, "");
  sanitized = sanitized.replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, "");

  // Remove base tags (can redirect relative URLs)
  sanitized = sanitized.replace(/<base[^>]*\/?>/gi, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}
