'use client';

/**
 * HeadingWithAnchor Component
 * REQ-FE-310: Heading with anchor link
 *
 * Features:
 * - Auto-generated id from heading text (slug)
 * - # anchor icon appears on hover
 * - Click copies URL with fragment to clipboard
 */

import { useState, useCallback } from "react";
import { Hash } from "lucide-react";
import { cn } from "~/lib/utils";

type HeadingLevel = "h2" | "h3" | "h4";

interface HeadingWithAnchorProps {
  level: HeadingLevel;
  id: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * HeadingWithAnchor Component
 *
 * Renders a heading with:
 * - Auto-generated ID for anchor links
 * - Copy-to-clipboard anchor button
 * - Hover interaction for anchor visibility
 * - Accessible structure
 */
export function HeadingWithAnchor({
  level,
  id,
  children,
  className,
}: HeadingWithAnchorProps) {
  const [showAnchor, setShowAnchor] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAnchor = useCallback(async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;

      await navigator.clipboard.writeText(url);

      setCopied(true);
      setTimeout(() => { setCopied(false); }, 2000);
    } catch (error) {
      console.error("Failed to copy anchor URL:", error);
    }
  }, [id]);

  const HeadingTag = level;

  const sizeClasses: Record<HeadingLevel, string> = {
    h2: "text-2xl",
    h3: "text-xl",
    h4: "text-lg",
  };

  return (
    <HeadingTag
      id={id}
      className={cn(
        "group relative flex items-center gap-2 scroll-mt-20",
        sizeClasses[level],
        className
      )}
      onMouseEnter={() => { setShowAnchor(true); }}
      onMouseLeave={() => { setShowAnchor(false); }}
    >
      {/* Heading content */}
      <span className="flex-1">{children}</span>

      {/* Anchor button */}
      <button
        onClick={handleCopyAnchor}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            void handleCopyAnchor();
          }
        }}
        className={cn(
          "flex-shrink-0 p-1 rounded transition-all",
          "text-neutral-400 hover:text-neutral-600",
          "dark:text-neutral-500 dark:hover:text-neutral-300",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
          "focus:outline-none focus:ring-2 focus:ring-primary-500",
          // Show on hover or focus
          showAnchor || copied ? "opacity-100" : "opacity-0",
          "md:group-hover:opacity-100 md:opacity-0",
          // Always visible on mobile
          "opacity-100 md:opacity-0"
        )}
        aria-label={`Copy link to ${typeof children === "string" ? children : "heading"}`}
      >
        {copied ? (
          <span className="text-xs font-medium text-green-600 dark:text-green-400">
            Copied!
          </span>
        ) : (
          <Hash className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </HeadingTag>
  );
}

/**
 * Extract text content from React children
 */
export function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === "string") {
    return children;
  }

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join("");
  }

  if (typeof children === "object" && children !== null && "props" in children) {
    const props = children.props as { children?: React.ReactNode };
    if (props.children) {
      return extractTextFromChildren(props.children);
    }
  }

  return "";
}
