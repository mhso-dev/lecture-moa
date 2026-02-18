import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

/**
 * Badge Variants
 * REQ-FE-033: Semantic (info, success, warning, error) + Role (instructor, student)
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]",
        secondary:
          "border-transparent bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-800)] dark:text-[var(--color-neutral-100)]",
        destructive:
          "border-transparent bg-[var(--color-error-600)] text-white hover:bg-[var(--color-error-700)]",
        outline: "text-[var(--color-foreground)]",
        // Semantic variants
        info:
          "border-transparent bg-[var(--color-info-100)] text-[var(--color-info-700)] dark:bg-[var(--color-info-900)] dark:text-[var(--color-info-100)]",
        success:
          "border-transparent bg-[var(--color-success-100)] text-[var(--color-success-700)] dark:bg-[var(--color-success-900)] dark:text-[var(--color-success-100)]",
        warning:
          "border-transparent bg-[var(--color-warning-100)] text-[var(--color-warning-700)] dark:bg-[var(--color-warning-900)] dark:text-[var(--color-warning-100)]",
        error:
          "border-transparent bg-[var(--color-error-100)] text-[var(--color-error-700)] dark:bg-[var(--color-error-900)] dark:text-[var(--color-error-100)]",
        // Role variants (REQ-FE-033)
        instructor:
          "border-transparent bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)] dark:text-[var(--color-primary-100)]",
        student:
          "border-transparent bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)] dark:bg-[var(--color-secondary-900)] dark:text-[var(--color-secondary-100)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge Component
 *
 * A badge component for displaying status, labels, or categorization.
 *
 * @example
 * ```tsx
 * <Badge>Default</Badge>
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="error">Failed</Badge>
 * <Badge variant="instructor">Instructor</Badge>
 * <Badge variant="student">Student</Badge>
 * ```
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
