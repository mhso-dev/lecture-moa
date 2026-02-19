/**
 * Date Utilities
 * Helper functions for date formatting and manipulation
 */

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "3 days ago")
 *
 * @param date - The date to format
 * @param options - Optional configuration
 * @param options.addSuffix - Whether to add "ago" suffix (default: true)
 * @returns Relative time string
 *
 * @example
 * ```ts
 * formatDistanceToNow(new Date(Date.now() - 3600000)) // "1 hour ago"
 * formatDistanceToNow(new Date(Date.now() - 60000)) // "1 minute ago"
 * ```
 */
export function formatDistanceToNow(
  date: Date,
  options: { addSuffix?: boolean } = {}
): string {
  const { addSuffix = true } = options;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const suffix = addSuffix ? " ago" : "";

  if (diffSec < 60) {
    return diffSec <= 1 ? "just now" : `${String(diffSec)} seconds${suffix}`;
  }
  if (diffMin < 60) {
    return diffMin === 1 ? `1 minute${suffix}` : `${String(diffMin)} minutes${suffix}`;
  }
  if (diffHour < 24) {
    return diffHour === 1 ? `1 hour${suffix}` : `${String(diffHour)} hours${suffix}`;
  }
  if (diffDay < 7) {
    return diffDay === 1 ? `1 day${suffix}` : `${String(diffDay)} days${suffix}`;
  }
  if (diffWeek < 4) {
    return diffWeek === 1 ? `1 week${suffix}` : `${String(diffWeek)} weeks${suffix}`;
  }
  if (diffMonth < 12) {
    return diffMonth === 1 ? `1 month${suffix}` : `${String(diffMonth)} months${suffix}`;
  }
  return diffYear === 1 ? `1 year${suffix}` : `${String(diffYear)} years${suffix}`;
}

/**
 * Format a date using standard format options
 *
 * @param date - The date to format
 * @param format - Format style: 'short', 'medium', 'long', 'full'
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * format(new Date(), 'short') // "2/19/26"
 * format(new Date(), 'medium') // "Feb 19, 2026"
 * format(new Date(), 'long') // "February 19, 2026"
 * ```
 */
export function format(
  date: Date,
  formatStyle: "short" | "medium" | "long" | "full" = "medium"
): string {
  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  };

  return new Intl.DateTimeFormat("en-US", optionsMap[formatStyle]).format(date);
}

/**
 * Check if a date is in the past
 *
 * @param date - The date to check
 * @returns True if the date is in the past
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if a date is today
 *
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
