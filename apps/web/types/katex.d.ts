/**
 * Type declarations for katex
 * @see https://github.com/KaTeX/KaTeX
 */

declare module "katex" {
  export interface KatexRenderOptions {
    displayMode?: boolean;
    output?: "html" | "mathml" | "htmlAndMathml";
    leqno?: boolean;
    fleqn?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    macros?: Record<string, string | number>;
    minRuleThickness?: number;
    colorIsTextColor?: boolean;
    maxSize?: number;
    maxExpand?: number;
    strict?: boolean | string | ((code: string, name: string) => boolean | string | void);
    trust?: boolean | ((context: { command: string; }) => boolean);
    globalGroup?: boolean;
  }

  export interface Katex {
    renderToString(tex: string, options?: KatexRenderOptions): string;
    render(tex: string, element: HTMLElement, options?: KatexRenderOptions): void;
    version: string;
  }

  const katex: Katex;
  export default katex;
}
