/* eslint-disable @typescript-eslint/no-deprecated */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
'use client';

/**
 * CodeBlock Component
 * REQ-FE-308: Code block with copy-to-clipboard functionality
 *
 * Features:
 * - Copy to clipboard functionality
 * - "Copied!" confirmation for 2 seconds
 * - Keyboard accessible (Tab-focusable, Enter/Space)
 * - Copy button visible on hover (desktop) or always (mobile)
 */

import { useState, useCallback, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

/**
 * CodeBlock Component
 *
 * Renders a code block with:
 * - Syntax highlighting (applied via className from rehype-highlight)
 * - Copy to clipboard button
 * - Language badge
 * - Accessible keyboard navigation
 */
export function CodeBlock({ children, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        return;
      }

      // Fallback to execCommand for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = children;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const success = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (success) {
        setCopied(true);
      }
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [children]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => { clearTimeout(timer); };
    }
  }, [copied]);

  return (
    <div className={cn("relative group", className)}>
      {/* Language badge */}
      {language && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-neutral-800 rounded text-xs text-neutral-300 font-mono uppercase z-10">
          {language}
        </div>
      )}

      {/* Copy button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            void handleCopy();
          }
        }}
        className={cn(
          "absolute top-2 right-2 h-8 w-8 z-10",
          "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "focus:opacity-100 focus:ring-2 focus:ring-primary-500",
          // Always visible on mobile
          "md:opacity-0 md:group-hover:opacity-100",
          "[@media(max-width:768px)]:opacity-100"
        )}
        aria-label={copied ? "Copied!" : "Copy code to clipboard"}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>

      {/* Code content */}
      <pre className="overflow-x-auto">
        <code className={cn(language && `language-${language}`)}>{children}</code>
      </pre>

      {/* Copied tooltip */}
      {copied && (
        <div
          className="absolute top-12 right-2 px-2 py-1 bg-green-600 text-white text-xs rounded shadow-lg animate-fade-in z-20"
          role="status"
          aria-live="polite"
        >
          Copied!
        </div>
      )}
    </div>
  );
}

/**
 * Animation for tooltip
 */
const styles = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
