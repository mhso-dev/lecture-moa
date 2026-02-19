/**
 * CourseCard Component
 * TASK-017: Grid/list course card with progress bar
 * TASK-021: Skeleton variant for loading state
 *
 * REQ-FE-400: Course List Display
 * REQ-FE-407: Loading Skeleton
 * REQ-FE-443: Course Progress Display
 */

import Link from "next/link";
import Image from "next/image";
import { Users, BookOpen, ImageIcon } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import type { CourseListItem, CourseCategory } from "@shared";
import { CourseProgressBar } from "./CourseProgressBar";

interface CourseCardProps {
  course: CourseListItem;
  variant: "grid" | "list";
  showProgress?: boolean;
  progressPercent?: number;
}

/**
 * Category label mapping
 */
const CATEGORY_LABELS: Record<CourseCategory, string> = {
  programming: "Programming",
  design: "Design",
  business: "Business",
  science: "Science",
  language: "Language",
  other: "Other",
};

/**
 * CourseCard - Displays course information in grid or list layout
 */
export function CourseCard({
  course,
  variant,
  showProgress = false,
  progressPercent = 0,
}: CourseCardProps) {
  const isGrid = variant === "grid";

  if (isGrid) {
    return (
      <Link
        href={`/courses/${course.id}`}
        aria-label={`View course: ${course.title}`}
        className="block h-full"
      >
        <Card className="h-full overflow-hidden transition-all hover:shadow-md group">
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-900)]">
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div
                data-testid="thumbnail-placeholder"
                className="flex h-full w-full items-center justify-center"
              >
                <ImageIcon className="h-12 w-12 text-[var(--color-neutral-400)]" />
              </div>
            )}
          </div>

          <CardContent className="p-4">
            {/* Category Badge */}
            <Badge variant="secondary" className="mb-2 text-xs">
              {CATEGORY_LABELS[course.category]}
            </Badge>

            {/* Title */}
            <h3 className="font-semibold line-clamp-2 mb-2">{course.title}</h3>

            {/* Instructor */}
            <p className="text-sm text-[var(--color-muted-foreground)] mb-3">
              {course.instructor.name}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course.enrolledCount}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {course.materialCount}
              </span>
            </div>

            {/* Progress Bar */}
            {showProgress && (
              <div className="mt-3">
                <CourseProgressBar percent={progressPercent} size="sm" />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  // List variant
  return (
    <Link
      href={`/courses/${course.id}`}
      aria-label={`View course: ${course.title}`}
      className="block"
    >
      <Card
        data-testid="course-card-list"
        className="flex overflow-hidden transition-all hover:shadow-md group"
      >
        {/* Thumbnail */}
        <div className="relative w-48 flex-shrink-0 overflow-hidden bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-900)]">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div
              data-testid="thumbnail-placeholder"
              className="flex h-full w-full items-center justify-center"
            >
              <ImageIcon className="h-12 w-12 text-[var(--color-neutral-400)]" />
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-4">
          {/* Category Badge */}
          <Badge variant="secondary" className="mb-2 text-xs">
            {CATEGORY_LABELS[course.category]}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-lg mb-1">{course.title}</h3>

          {/* Description */}
          <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-2 mb-2">
            {course.description}
          </p>

          {/* Instructor */}
          <p className="text-sm text-[var(--color-muted-foreground)] mb-3">
            by {course.instructor.name}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course.enrolledCount}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course.materialCount}
            </span>
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="mt-3">
              <CourseProgressBar percent={progressPercent} size="sm" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

interface CourseCardSkeletonProps {
  variant: "grid" | "list";
}

/**
 * CourseCardSkeleton - Loading placeholder for CourseCard
 */
export function CourseCardSkeleton({ variant }: CourseCardSkeletonProps) {
  const isGrid = variant === "grid";

  if (isGrid) {
    return (
      <div data-testid="course-card-skeleton-grid" className="h-full">
        <Card className="h-full overflow-hidden">
          {/* Thumbnail skeleton */}
          <Skeleton className="aspect-video" data-testid="skeleton-thumbnail" />

          <CardContent className="p-4 space-y-3">
            {/* Badge skeleton */}
            <Skeleton className="h-5 w-20" data-testid="skeleton-badge" />

            {/* Title skeleton */}
            <Skeleton className="h-6 w-full" data-testid="skeleton-title" />
            <Skeleton className="h-6 w-3/4" data-testid="skeleton-title-2" />

            {/* Instructor skeleton */}
            <Skeleton className="h-4 w-24" data-testid="skeleton-instructor" />

            {/* Stats skeleton */}
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" data-testid="skeleton-stat-1" />
              <Skeleton className="h-4 w-16" data-testid="skeleton-stat-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List skeleton
  return (
    <div data-testid="course-card-skeleton-list">
      <Card className="flex overflow-hidden">
        {/* Thumbnail skeleton */}
        <Skeleton className="w-48 h-32 flex-shrink-0" data-testid="skeleton-thumbnail" />

        <CardContent className="flex-1 p-4 space-y-3">
          {/* Badge skeleton */}
          <Skeleton className="h-5 w-20" data-testid="skeleton-badge" />

          {/* Title skeleton */}
          <Skeleton className="h-6 w-3/4" data-testid="skeleton-title" />

          {/* Description skeleton */}
          <Skeleton className="h-4 w-full" data-testid="skeleton-desc-1" />
          <Skeleton className="h-4 w-2/3" data-testid="skeleton-desc-2" />

          {/* Instructor skeleton */}
          <Skeleton className="h-4 w-24" data-testid="skeleton-instructor" />

          {/* Stats skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" data-testid="skeleton-stat-1" />
            <Skeleton className="h-4 w-16" data-testid="skeleton-stat-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
