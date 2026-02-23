'use client';

/**
 * MarkdownRenderer Component
 * REQ-FE-300: Core Markdown renderer component
 *
 * Plugin pipeline (in order):
 * 1. remarkGfm - tables, strikethrough, task lists
 * 2. remarkMath - math parsing
 * 3. remarkCallout - callout blocks
 * 4. rehypeKatex - math rendering
 * 5. rehypeHighlight - syntax highlighting
 * 6. rehypeSanitize - XSS prevention (custom schema)
 */

import ReactMarkdown, { type ExtraProps } from "react-markdown";
import type { ReactNode } from "react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Components } from "react-markdown";
import Image from "next/image";

import type { QAHighlightData } from "@shared";
import { remarkCallout } from "~/lib/markdown/plugins/remark-callout";
import { rehypeQAHighlights } from "~/lib/markdown/plugins/rehype-qa-highlights";
import { SlugCounter } from "~/lib/markdown/utils/slug";
import { CodeBlock } from "./CodeBlock";
import { Callout, type CalloutType } from "./Callout";
import { HeadingWithAnchor, extractTextFromChildren } from "./HeadingWithAnchor";
import { MathBlock } from "./MathBlock";

import "~/lib/markdown/highlight-theme.css";
import "~/lib/markdown/highlight-qa.css";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** Q&A highlight data for rendering <mark> elements (REQ-FE-009) */
  highlights?: QAHighlightData[];
}

/**
 * Custom sanitize schema that allows:
 * - Standard HTML elements
 * - class attribute for code blocks
 * - id attributes for heading anchors
 * - data-* attributes for callouts
 * - KaTeX classes and attributes
 */
const customSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "figure",
    "figcaption",
    "mark",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": ["className", "id", "data-*"],
    code: [["className", { value: /language-\w+/ }]],
    span: [["className", { value: /katex|katex-.+/ }]],
    div: [["className", { value: /katex-display|katex/ }]],
    mark: ["dataHighlightId", "dataQuestionCount", "dataStatus"],
    img: ["src", "alt", "title", "loading", "width", "height"],
    a: ["href", "title", "target", "rel"],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
  },
};

/**
 * @MX:NOTE: [AUTO] Slug generation uses shared SlugCounter for consistency
 * @MX:SPEC: SPEC-FE-009
 *
 * The SlugCounter is shared between:
 * - MarkdownRenderer (React component heading overrides)
 * - rehype-qa-highlights (HAST-level plugin for section identification)
 *
 * Both MUST use the same algorithm to ensure heading IDs match.
 */

/**
 * MarkdownRenderer Component
 *
 * Transforms Markdown content into styled HTML with:
 * - GFM support (tables, strikethrough, task lists)
 * - Syntax highlighting
 * - Math rendering (KaTeX)
 * - Educational callouts
 * - Code block copy functionality
 * - Heading anchors
 * - XSS protection
 */
export function MarkdownRenderer({ content, className, highlights }: MarkdownRendererProps) {
  // Create fresh slug counter for each render
  const slugCounter = new SlugCounter();

  const components: Components = {
    // Code blocks
    code({ className: codeClassName, children, node: _node, ...props }: React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & ExtraProps) {
      const match = /language-(\w+)/.exec(codeClassName ?? "");
      const language = match ? match[1] : undefined;
      const codeString = extractTextFromChildren(children).replace(/\n$/, "");

      // Check if it's inline code (no className) or block code (has className)
      const isInline = !codeClassName;

      if (!isInline && codeClassName) {
        return <CodeBlock language={language}>{codeString}</CodeBlock>;
      }

      return (
        <code className={codeClassName} {...props}>
          {children}
        </code>
      );
    },

    // Headings with anchors
    h2({ children, ...props }: React.ClassAttributes<HTMLHeadingElement> & React.HTMLAttributes<HTMLHeadingElement> & ExtraProps) {
      const text = extractTextFromChildren(children);
      const id = slugCounter.generateUniqueSlug(text);
      return (
        <HeadingWithAnchor level="h2" id={id} {...props}>
          {children}
        </HeadingWithAnchor>
      );
    },

    h3({ children, ...props }: React.ClassAttributes<HTMLHeadingElement> & React.HTMLAttributes<HTMLHeadingElement> & ExtraProps) {
      const text = extractTextFromChildren(children);
      const id = slugCounter.generateUniqueSlug(text);
      return (
        <HeadingWithAnchor level="h3" id={id} {...props}>
          {children}
        </HeadingWithAnchor>
      );
    },

    h4({ children, ...props }: React.ClassAttributes<HTMLHeadingElement> & React.HTMLAttributes<HTMLHeadingElement> & ExtraProps) {
      const text = extractTextFromChildren(children);
      const id = slugCounter.generateUniqueSlug(text);
      return (
        <HeadingWithAnchor level="h4" id={id} {...props}>
          {children}
        </HeadingWithAnchor>
      );
    },

    // Images with next/image optimization
    img({ src, alt, ...props }: React.ClassAttributes<HTMLImageElement> & React.ImgHTMLAttributes<HTMLImageElement> & ExtraProps) {
      if (!src) return null;

      // Ensure src is a string
      const imgSrc = typeof src === "string" ? src : "";

      // External images
      if (imgSrc.startsWith("http://") || imgSrc.startsWith("https://")) {
        return (
          <figure className="my-6">
            <Image
              src={imgSrc}
              alt={alt ?? ""}
              width={800}
              height={600}
              className="rounded-lg w-full h-auto"
              loading="lazy"
              unoptimized // For external images
            />
            {alt && (
              <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                {alt}
              </figcaption>
            )}
          </figure>
        );
      }

      // Relative images (assume they're in public folder or CDN)
      return (
        <figure className="my-6">
          <img
            src={imgSrc}
            alt={alt ?? ""}
            className="rounded-lg w-full h-auto"
            loading="lazy"
            {...props}
          />
          {alt && (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              {alt}
            </figcaption>
          )}
        </figure>
      );
    },

    // Callout blocks (custom node type from remark-callout)
    callout({ calloutType, title, children }: { calloutType: string; title?: string; children?: ReactNode }) {
      return (
        <Callout type={calloutType as CalloutType} title={title}>
          {children}
        </Callout>
      );
    },

    // Math blocks (from remark-math)
    // Inline math
    span({ className: spanClassName, children, ...props }: React.ClassAttributes<HTMLSpanElement> & React.HTMLAttributes<HTMLSpanElement> & ExtraProps) {
      if (spanClassName?.includes("math-inline")) {
        const mathText = extractTextFromChildren(children);
        return <MathBlock math={mathText} inline />;
      }
      return (
        <span className={spanClassName} {...props}>
          {children}
        </span>
      );
    },

    // Block math
    div({ className: divClassName, children, ...props }: React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> & ExtraProps) {
      if (divClassName?.includes("math-display")) {
        const mathText = extractTextFromChildren(children);
        return <MathBlock math={mathText} inline={false} />;
      }
      return (
        <div className={divClassName} {...props}>
          {children}
        </div>
      );
    },

    // Tables with responsive wrapper
    table({ children, ...props }: React.ClassAttributes<HTMLTableElement> & React.TableHTMLAttributes<HTMLTableElement> & ExtraProps) {
      return (
        <div className="my-6 overflow-x-auto">
          <table {...props}>{children}</table>
        </div>
      );
    },

    // Links with security attributes
    a({ href, children, ...props }: React.ClassAttributes<HTMLAnchorElement> & React.AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps) {
      const isExternal = (href?.startsWith("http://") ?? false) || (href?.startsWith("https://") ?? false);

      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkCallout]}
        rehypePlugins={[
          [rehypeKatex, { strict: false, throwOnError: false }],
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
          // REQ-FE-009: Q&A highlights injected before sanitize
          ...(highlights && highlights.length > 0
            ? [[rehypeQAHighlights, { highlights }] as const]
            : []),
          [rehypeSanitize, customSanitizeSchema],
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
