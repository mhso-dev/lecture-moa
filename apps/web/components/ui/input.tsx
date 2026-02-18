import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

/**
 * Input Variants
 * REQ-FE-032: 4 states (default, error, disabled, focused)
 */
const inputVariants = cva(
  "flex w-full rounded-[var(--radius-md)] border bg-transparent px-3 py-2 text-sm transition-all duration-[var(--duration-fast)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-border)] focus-visible:border-[var(--color-primary-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)]/20",
        error:
          "border-[var(--color-error-500)] focus-visible:border-[var(--color-error-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-error-500)]/20",
      },
      inputSize: {
        default: "h-10",
        sm: "h-8 text-xs",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  error?: boolean;
}

/**
 * Input Component
 *
 * A flexible input component with support for different states and sizes.
 *
 * @example
 * ```tsx
 * <Input placeholder="Default input" />
 * <Input error placeholder="Error state" />
 * <Input disabled placeholder="Disabled" />
 * <Input inputSize="lg" placeholder="Large input" />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant: error ? "error" : variant, inputSize, className })
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
