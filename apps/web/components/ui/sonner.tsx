"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { useEffect, useState } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Sonner Toaster Component
 * REQ-FE-034: Toast notifications
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <Toaster />
 *
 * // In components
 * toast.success("Success message");
 * toast.error("Error message");
 * toast.warning("Warning message");
 * toast.info("Info message");
 * ```
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolved theme (handles 'system' theme)
  const toasterTheme = mounted ? (resolvedTheme ?? theme ?? "system") : "system";

  return (
    <Sonner
      theme={toasterTheme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--color-background)] group-[.toaster]:text-[var(--color-foreground)] group-[.toaster]:border-[var(--color-border)] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[var(--color-muted-foreground)]",
          actionButton:
            "group-[.toast]:bg-[var(--color-neutral-100)] group-[.toast]:text-[var(--color-neutral-900)] group-[.toast]:hover:bg-[var(--color-neutral-200)] dark:group-[.toast]:bg-[var(--color-neutral-800)] dark:group-[.toast]:text-[var(--color-neutral-100)]",
          cancelButton:
            "group-[.toast]:bg-[var(--color-muted-background)] group-[.toast]:text-[var(--color-muted-foreground)]",
          success: "group-[.toast]:border-[var(--color-success-500)] group-[.toast]:bg-[var(--color-success-50)] dark:group-[.toast]:bg-[var(--color-success-950)]",
          error: "group-[.toast]:border-[var(--color-error-500)] group-[.toast]:bg-[var(--color-error-50)] dark:group-[.toast]:bg-[var(--color-error-950)]",
          warning: "group-[.toast]:border-[var(--color-warning-500)] group-[.toast]:bg-[var(--color-warning-50)] dark:group-[.toast]:bg-[var(--color-warning-950)]",
          info: "group-[.toast]:border-[var(--color-info-500)] group-[.toast]:bg-[var(--color-info-50)] dark:group-[.toast]:bg-[var(--color-info-950)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
