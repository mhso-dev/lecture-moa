'use client';

/**
 * Callout Component
 * REQ-FE-304: Educational callout blocks
 *
 * Features:
 * - 5 types: NOTE (blue), TIP (green), WARNING (amber), IMPORTANT (violet), CAUTION (red)
 * - Colored left border, icon (Lucide), background tint, bold type label
 */

import {
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";

export type CalloutType = "note" | "tip" | "warning" | "important" | "caution";

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

interface CalloutConfig {
  icon: LucideIcon;
  label: string;
  styles: {
    container: string;
    icon: string;
    title: string;
  };
}

const CALLOUT_CONFIGS: Record<CalloutType, CalloutConfig> = {
  note: {
    icon: Info,
    label: "Note",
    styles: {
      container:
        "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400",
      icon: "text-blue-600 dark:text-blue-400",
      title: "text-blue-800 dark:text-blue-200",
    },
  },
  tip: {
    icon: Lightbulb,
    label: "Tip",
    styles: {
      container:
        "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-400",
      icon: "text-emerald-600 dark:text-emerald-400",
      title: "text-emerald-800 dark:text-emerald-200",
    },
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    styles: {
      container:
        "border-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-400",
      icon: "text-amber-600 dark:text-amber-400",
      title: "text-amber-800 dark:text-amber-200",
    },
  },
  important: {
    icon: AlertCircle,
    label: "Important",
    styles: {
      container:
        "border-violet-500 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-400",
      icon: "text-violet-600 dark:text-violet-400",
      title: "text-violet-800 dark:text-violet-200",
    },
  },
  caution: {
    icon: XCircle,
    label: "Caution",
    styles: {
      container:
        "border-red-500 bg-red-50 dark:bg-red-950/30 dark:border-red-400",
      icon: "text-red-600 dark:text-red-400",
      title: "text-red-800 dark:text-red-200",
    },
  },
};

/**
 * Callout Component
 *
 * Renders educational callout blocks with:
 * - Type-specific colors and icons
 * - Accessible structure
 * - Dark mode support
 */
export function Callout({ type, title, children, className }: CalloutProps) {
  const config = CALLOUT_CONFIGS[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "my-6 rounded-lg border-l-4 p-4",
        "not-prose", // Prevent prose styles from interfering
        config.styles.container,
        className
      )}
      role="note"
      aria-label={`${config.label} callout`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={cn("h-5 w-5", config.styles.icon)} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className={cn("font-semibold mb-1", config.styles.title)}>
            {title || config.label}
          </div>

          {/* Body */}
          <div className="text-sm text-neutral-700 dark:text-neutral-300 [&>p:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
