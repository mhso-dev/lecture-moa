/**
 * Shared slug generation utility
 * REQ-FE-009: Extracted from MarkdownRenderer for reuse in rehype plugins
 *
 * The same algorithm is used by:
 * - MarkdownRenderer (React component overrides for headings)
 * - rehype-qa-highlights (HAST-level plugin for section identification)
 *
 * Both consumers MUST use this function to ensure heading IDs match.
 */

/**
 * Generate a URL-friendly slug from heading text.
 * Strips special characters, replaces spaces with hyphens, and normalizes.
 */
export function generateBaseSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Slug counter class for generating unique heading IDs within a render pass.
 * Each MarkdownRenderer render and each rehype plugin invocation should
 * create a fresh instance to avoid cross-render collisions.
 */
export class SlugCounter {
  private counts = new Map<string, number>();

  /**
   * Generate a unique slug. First occurrence returns the base slug,
   * subsequent occurrences append a numeric suffix.
   */
  generateUniqueSlug(text: string): string {
    const baseSlug = generateBaseSlug(text);
    const count = this.counts.get(baseSlug) ?? 0;
    this.counts.set(baseSlug, count + 1);
    return count === 0 ? baseSlug : `${baseSlug}-${String(count)}`;
  }

  /** Reset the counter for a new render pass. */
  clear(): void {
    this.counts.clear();
  }
}
