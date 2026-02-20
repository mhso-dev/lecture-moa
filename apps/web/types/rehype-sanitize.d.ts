/**
 * Type declarations for rehype-sanitize
 * @see https://github.com/rehypejs/rehype-sanitize
 */

declare module "rehype-sanitize" {
  import { Plugin } from "unified";

  export interface Schema {
    tagNames?: string[];
    attributes?: Record<string, (string | [string, { value: RegExp }])[]>;
    protocols?: Record<string, string[]>;
    ancestors?: Record<string, string[]>;
    clobber?: string[];
    clobberPrefix?: string;
    strip?: string[];
    comment?: boolean;
  }

  export const defaultSchema: Schema;

  const rehypeSanitize: Plugin<[Schema?], unknown>;
  export default rehypeSanitize;
}
