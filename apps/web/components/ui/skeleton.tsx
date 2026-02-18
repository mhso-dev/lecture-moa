import { cn } from "~/lib/utils";

/**
 * Skeleton Component
 * REQ-FE-033: Loading placeholder
 *
 * @example
 * ```tsx
 * <Skeleton className="h-12 w-12 rounded-full" />
 * <Skeleton className="h-4 w-[250px]" />
 * <Skeleton className="h-4 w-[200px]" />
 * ```
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-md)] bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-800)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
