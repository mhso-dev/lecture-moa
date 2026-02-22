import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Button Variants
 * REQ-FE-032: 5 variants (default, secondary, ghost, destructive, outline) + 4 sizes + loading state
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] active:bg-[var(--color-primary-800)]",
        secondary:
          "bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-200)] active:bg-[var(--color-neutral-300)] dark:bg-[var(--color-neutral-800)] dark:text-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)]",
        destructive:
          "bg-[var(--color-error-600)] text-white hover:bg-[var(--color-error-700)] active:bg-[var(--color-error-800)]",
        outline:
          "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] dark:hover:bg-[var(--color-neutral-800)] dark:hover:text-[var(--color-neutral-100)]",
        ghost:
          "bg-transparent hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] dark:hover:bg-[var(--color-neutral-800)] dark:hover:text-[var(--color-neutral-100)]",
        link: "text-[var(--color-primary-600)] underline-offset-4 hover:underline dark:text-[var(--color-primary-400)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[var(--radius-sm)] px-3 text-xs",
        lg: "h-12 rounded-[var(--radius-md)] px-6 text-base",
        xl: "h-14 rounded-[var(--radius-lg)] px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

/**
 * Button Component
 *
 * A versatile button component with multiple variants, sizes, and states.
 *
 * @example
 * ```tsx
 * <Button>Default Button</Button>
 * <Button variant="secondary">Secondary</Button>
 * <Button variant="destructive">Delete</Button>
 * <Button variant="outline">Outline</Button>
 * <Button variant="ghost">Ghost</Button>
 * <Button loading>Loading...</Button>
 * <Button size="lg">Large Button</Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled ?? loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" />}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
