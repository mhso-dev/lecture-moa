/**
 * Type declarations for markdown-related packages
 */

declare module "@uiw/react-md-editor" {
  import { ComponentType } from "react";

  interface MDEditorProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    preview?: "edit" | "live" | "preview";
    height?: number | string;
    visibleDragbar?: boolean;
    hideToolbar?: boolean;
    enableScroll?: boolean;
    style?: React.CSSProperties;
    textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  }

  const MDEditor: ComponentType<MDEditorProps>;
  export default MDEditor;
}

declare module "react-markdown" {
  import { ComponentType, ReactNode } from "react";

  type Components = Record<string, ComponentType<{ children?: ReactNode; [key: string]: unknown }> | undefined>;

  interface ReactMarkdownProps {
    children?: string;
    remarkPlugins?: unknown[];
    rehypePlugins?: unknown[];
    components?: Components;
    [key: string]: unknown;
  }

  const ReactMarkdown: ComponentType<ReactMarkdownProps>;
  export default ReactMarkdown;

  export type { Components };
}

declare module "remark-gfm" {
  import { Plugin } from "unified";
  const remarkGfm: Plugin;
  export default remarkGfm;
}

declare module "remark-math" {
  import { Plugin } from "unified";
  const remarkMath: Plugin;
  export default remarkMath;
}

declare module "rehype-katex" {
  import { Plugin } from "unified";
  const rehypeKatex: Plugin;
  export default rehypeKatex;
}

declare module "rehype-highlight" {
  import { Plugin } from "unified";
  const rehypeHighlight: Plugin;
  export default rehypeHighlight;
}

declare module "rehype-sanitize" {
  import { Plugin } from "unified";

  type SchemaAttributes = Record<string, (string | [string, { value: RegExp }])[]>;

  interface Schema {
    tagNames?: string[];
    attributes?: SchemaAttributes;
    protocols?: Record<string, string[]>;
  }

  const defaultSchema: Schema;
  const rehypeSanitize: Plugin<[Schema?]>;
  export default rehypeSanitize;
  export { defaultSchema };
}

declare module "katex" {
  interface KatexOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    strict?: boolean | string;
    [key: string]: unknown;
  }

  function renderToString(tex: string, options?: KatexOptions): string;
}
