/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
'use client';

/**
 * MathBlock Component
 * REQ-FE-303: KaTeX wrapper for math expressions
 *
 * Features:
 * - Support inline and block math
 * - Graceful error fallback (display raw in <code> with error indicator)
 * - No blank spaces on KaTeX failure
 */

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";

interface MathBlockProps {
  math: string;
  inline?: boolean;
  className?: string;
}

interface KatexRenderResult {
  html: string;
  error?: Error;
}

/**
 * MathBlock Component
 *
 * Renders math expressions using KaTeX with:
 * - Inline and block math support
 * - Error handling with fallback display
 * - Accessible structure
 */
export function MathBlock({ math, inline = false, className }: MathBlockProps) {
  const [result, setResult] = useState<KatexRenderResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function renderMath() {
      try {
        // Dynamically import katex to avoid SSR issues
        const katex = (await import("katex")).default;

        const html: string = katex.renderToString(math, {
          displayMode: !inline,
          throwOnError: false,
          strict: false,
          trust: true,
        });

        if (mounted) {
          setResult({ html });
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setResult({
            html: "",
            error: error instanceof Error ? error : new Error("Failed to render math"),
          });
          setIsLoading(false);
        }
      }
    }

    void renderMath();

    return () => {
      mounted = false;
    };
  }, [math, inline]);

  // Loading state
  if (isLoading) {
    return inline ? (
      <span className={cn("text-neutral-400 animate-pulse", className)}>
        {math}
      </span>
    ) : (
      <div className={cn("text-neutral-400 animate-pulse p-4", className)}>
        {math}
      </div>
    );
  }

  // Error state - show raw math with error indicator
  if (result?.error || !result?.html) {
    if (inline) {
      return (
        <code
          className={cn(
            "px-1 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm",
            "inline-flex items-center gap-1",
            className
          )}
          title={result?.error?.message ?? "Math rendering error"}
          role="alert"
        >
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          <span>{math}</span>
        </code>
      );
    }

    return (
      <div
        className={cn(
          "my-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800",
          className
        )}
        role="alert"
      >
        <div className="flex items-start gap-2">
          <AlertCircle
            className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Math rendering error
            </div>
            <code className="text-sm text-red-700 dark:text-red-300 break-all">
              {math}
            </code>
            {result?.error?.message && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                {result.error.message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success - render KaTeX HTML
  if (inline) {
    return (
      <span
        className={cn("katex-inline", className)}
        dangerouslySetInnerHTML={{ __html: result.html }}
        aria-label={`Math: ${math}`}
      />
    );
  }

  return (
    <div
      className={cn(
        "my-4 overflow-x-auto",
        "katex-block",
        "[&_.katex]:text-lg",
        className
      )}
      dangerouslySetInnerHTML={{ __html: result.html }}
      aria-label={`Math: ${math}`}
    />
  );
}

/**
 * InlineMath Component
 * Convenience wrapper for inline math expressions
 */
export function InlineMath({ math, className }: Omit<MathBlockProps, "inline">) {
  return <MathBlock math={math} inline className={className} />;
}

/**
 * BlockMath Component
 * Convenience wrapper for block math expressions
 */
export function BlockMath({ math, className }: Omit<MathBlockProps, "inline">) {
  return <MathBlock math={math} inline={false} className={className} />;
}
