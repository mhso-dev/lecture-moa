import * as React from "react";
import { cn } from "~/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

/**
 * Textarea Component
 *
 * A flexible textarea component with error state support.
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Enter your message" />
 * <Textarea error placeholder="Error state" />
 * <Textarea rows={5} placeholder="Large textarea" />
 * ```
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-[var(--radius-md)] border bg-transparent px-3 py-2 text-sm transition-all duration-[var(--duration-fast)] placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-[var(--color-error-500)] focus-visible:border-[var(--color-error-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-error-500)]/20"
            : "border-[var(--color-border)] focus-visible:border-[var(--color-primary-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)]/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
