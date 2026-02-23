"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { useAuthStore } from "~/stores/auth.store";

interface MaterialMetadataProps {
  /** Material title */
  title: string;
  /** Author information */
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  /** Creation date (ISO string) */
  createdAt: string;
  /** Last update date (ISO string) */
  updatedAt: string;
  /** Estimated read time in minutes */
  readTimeMinutes: number;
  /** Array of tags */
  tags: string[];
  /** Publication status */
  status: "draft" | "published";
  /** Additional CSS classes */
  className?: string;
}

/**
 * MaterialMetadata Component
 * REQ-FE-323: Display material metadata above content
 *
 * Features:
 * - Material title (h1)
 * - Author avatar and name
 * - Created/updated dates
 * - Read time estimate
 * - Tag badges
 * - Status badge (instructor only)
 *
 * @example
 * ```tsx
 * <MaterialMetadata
 *   title={material.title}
 *   author={material.author}
 *   createdAt={material.createdAt}
 *   updatedAt={material.updatedAt}
 *   readTimeMinutes={material.readTimeMinutes}
 *   tags={material.tags}
 *   status={material.status}
 * />
 * ```
 */
export function MaterialMetadata({
  title,
  author,
  createdAt,
  updatedAt,
  readTimeMinutes,
  tags,
  status,
  className,
}: MaterialMetadataProps) {
  const role = useAuthStore((state) => state.role);
  const isInstructor = role === "instructor";

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get author initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className={cn("space-y-4", className)}>
      {/* Title */}
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
        {title}
      </h1>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={author.avatarUrl ?? undefined} alt={author.name} />
            <AvatarFallback className="text-xs">
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
          <span>{author.name}</span>
        </div>

        {/* Separator */}
        <span className="hidden sm:inline">|</span>

        {/* Dates */}
        <div className="flex items-center gap-2">
          <time dateTime={createdAt}>{formatDate(createdAt)}</time>
          {updatedAt !== createdAt && (
            <>
              <span>(수정: </span>
              <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
              <span>)</span>
            </>
          )}
        </div>

        {/* Separator */}
        <span className="hidden sm:inline">|</span>

        {/* Read time */}
        <span>{readTimeMinutes}분 읽기</span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Status badge (instructor only) */}
      {isInstructor && (
        <Badge
          variant={status === "published" ? "default" : "outline"}
          className={cn(
            "text-xs",
            status === "published"
              ? "bg-[var(--color-success-500)] text-white"
              : "border-[var(--color-warning-500)] text-[var(--color-warning-600)]"
          )}
        >
          {status === "published" ? "게시됨" : "초안"}
        </Badge>
      )}
    </header>
  );
}
