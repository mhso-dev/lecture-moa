/**
 * Type declarations for rehype-katex
 * @see https://github.com/remarkjs/rehype-katex
 */

declare module "rehype-katex" {
  import { Plugin } from "unified";

  export interface RehypeKatexOptions {
    strict?: boolean | string | ((code: string, name: string) => boolean | string | void);
    throwOnError?: boolean;
    errorColor?: string;
    macros?: Record<string, string>;
    displayMode?: boolean;
    fleqn?: boolean;
    leqno?: boolean;
    minRuleThickness?: number;
    trust?: boolean | ((context: { command: string }) => boolean);
    output?: "html" | "mathml" | "htmlAndMathml";
  }

  const rehypeKatex: Plugin<[RehypeKatexOptions?], unknown>;
  export default rehypeKatex;
}
