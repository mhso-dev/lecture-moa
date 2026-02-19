"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "~/lib/utils";

/**
 * Progress Component
 * REQ-FE-443: Course progress display
 */
const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-800)]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      data-testid="progress-fill"
      className="h-full w-full flex-1 bg-[var(--color-primary-600)] transition-all"
      style={{ transform: `translateX(-${String(100 - (value ?? 0))}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
