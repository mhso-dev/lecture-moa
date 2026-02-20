/**
 * Type declarations for react-markdown
 * @see https://github.com/remarkjs/react-markdown
 *
 * Note: Using simplified types to allow flexible component definitions.
 * The actual react-markdown package exports proper types when installed.
 */

declare module "react-markdown" {
  import { ComponentType, ReactNode, ClassAttributes, HTMLAttributes } from "react";

  export interface ExtraProps {
    node?: unknown;
  }

  // Use a more permissive type for components to avoid strict type checking issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Components = Record<string, ComponentType<any> | undefined>;

  export interface ReactMarkdownProps {
    children?: string;
    className?: string;
    components?: Components;
    remarkPlugins?: Plugin[];
    rehypePlugins?: Plugin[];
    skipHtml?: boolean;
    sourcePos?: boolean;
    rawSourcePos?: boolean;
    includeElementIndex?: boolean;
    allowedElements?: string[];
    disallowedElements?: string[];
    allowElement?: (element: unknown) => boolean;
    unwrapDisallowed?: boolean;
    linkTarget?: string | ((href: string, children: ReactNode, title: string | null) => string);
    transformLinkUri?: (href: string, children: ReactNode, title: string | null) => string;
    transformImageUri?: (src: string, alt: string, title: string | null) => string;
  }

  // Plugin type for remark and rehype plugins
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Plugin = any;

  const ReactMarkdown: ComponentType<ReactMarkdownProps>;
  export default ReactMarkdown;
}
