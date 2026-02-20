/**
 * Type declarations for rehype-highlight
 * @see https://github.com/rehypejs/rehype-highlight
 */

declare module "rehype-highlight" {
  import { Plugin } from "unified";

  export interface RehypeHighlightOptions {
    detect?: boolean;
    ignoreMissing?: boolean;
    subset?: string[] | false;
    prefix?: string;
    plainText?: string[];
    languages?: Record<string, unknown>;
    aliases?: Record<string, string[]>;
  }

  const rehypeHighlight: Plugin<[RehypeHighlightOptions?], unknown>;
  export default rehypeHighlight;
}
