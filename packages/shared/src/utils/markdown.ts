/**
 * Markdown Utility Functions
 * REQ-FE-N704: Strip Markdown syntax for plain text previews
 */

/**
 * Strip Markdown syntax and return plain text
 * REQ-FE-N704: Used by MemoCard and MemoListItem for previews
 *
 * @param markdown - Markdown text to strip
 * @param maxLength - Maximum length (default 150)
 * @returns Plain text with Markdown syntax removed
 *
 * @example
 * ```ts
 * stripMarkdown("**bold** and *italic*")
 * // Returns: "bold and italic"
 *
 * stripMarkdown("# Heading\n\nParagraph", 20)
 * // Returns: "Heading Paragraph"
 * ```
 */
export function stripMarkdown(
  markdown: string,
  maxLength: number = 150
): string {
  if (!markdown) return "";

  let text = markdown;

  // Remove code blocks (```code```)
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    // Extract content between triple backticks, removing language identifier
    const lines = match.split("\n");
    if (lines.length > 2) {
      // Remove first and last lines (``` and ```)
      return lines.slice(1, -1).join(" ");
    }
    return "";
  });

  // Remove inline code (`code`)
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove links but keep text [text](url)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");

  // Remove headings (# ## ### etc.)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove bold (**bold** or __bold__)
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");

  // Remove italic (*italic* or _italic_)
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // Remove strikethrough (~~text~~)
  text = text.replace(/~~([^~]+)~~/g, "$1");

  // Remove blockquotes (> text)
  text = text.replace(/^>\s+/gm, "");

  // Remove unordered list markers (- or *)
  text = text.replace(/^[-*]\s+/gm, "");

  // Remove ordered list markers (1. 2. etc.)
  text = text.replace(/^\d+\.\s+/gm, "");

  // Remove horizontal rules (--- or ***)
  text = text.replace(/^[-*]{3,}$/gm, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Normalize whitespace
  text = text.replace(/\s+/g, " ");

  // Trim leading and trailing whitespace
  text = text.trim();

  // Truncate if exceeds maxLength
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim() + "...";
  }

  return text;
}
