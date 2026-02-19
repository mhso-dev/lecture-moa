"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Globe,
  EyeOff,
  MessageCircle,
} from "lucide-react";
import type { MaterialListItem } from "@shared";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { useAuthStore } from "~/stores/auth.store";
import { useDeleteMaterial, useToggleMaterialStatus } from "~/hooks/materials";

interface MaterialCardProps {
  /** Material list item data */
  material: MaterialListItem;
  /** Course ID for navigation */
  courseId: string;
  /** Whether current user is an instructor */
  isInstructor: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MaterialCard Component
 * REQ-FE-331: Display material card in list view
 *
 * Features:
 * - Material title
 * - Excerpt (first 150 chars of plain text)
 * - Estimated read time
 * - Author avatar and name
 * - Last updated date
 * - Tag badges
 * - Status badge (draft/published) - instructor only
 * - Q&A count indicator
 * - Card click navigates to material viewer
 * - Instructor actions (edit, delete, toggle publish) in dropdown menu
 *
 * @example
 * ```tsx
 * <MaterialCard
 *   material={material}
 *   courseId={courseId}
 *   isInstructor={isInstructor}
 * />
 * ```
 */
export function MaterialCard({
  material,
  courseId,
  isInstructor,
  className,
}: MaterialCardProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Check role from auth store for additional safety
  const role = useAuthStore((state) => state.role);
  const isActuallyInstructor = isInstructor && role === "instructor";

  // Mutations
  const deleteMutation = useDeleteMaterial(courseId);
  const toggleStatusMutation = useToggleMaterialStatus(courseId);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      });
    }
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

  // Truncate excerpt
  const truncateExcerpt = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  // Handle card click - navigate to viewer
  const handleCardClick = () => {
    router.push(`/courses/${courseId}/materials/${material.id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(material.id);
      setIsDeleteDialogOpen(false);
      // Success toast would be handled by the calling page
    } catch {
      // Error handling is done by mutation
      setIsDeleting(false);
    }
  };

  // Handle toggle publish status
  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    try {
      await toggleStatusMutation.mutateAsync(material.id);
      setIsTogglingStatus(false);
    } catch {
      setIsTogglingStatus(false);
    }
  };

  // Prevent dropdown from triggering card click
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md hover:border-[var(--color-primary-300)] dark:hover:border-[var(--color-primary-700)]",
          className
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold line-clamp-2 text-[var(--color-foreground)]">
                {material.title}
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2 text-sm">
                {truncateExcerpt(material.excerpt)}
              </CardDescription>
            </div>

            {/* Instructor actions dropdown */}
            {isActuallyInstructor && (
              <div onClick={handleDropdownClick}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label="Material actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/courses/${courseId}/materials/${material.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus();
                      }}
                      disabled={isTogglingStatus}
                    >
                      {material.status === "published" ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Globe className="mr-2 h-4 w-4" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-[var(--color-danger-600)] focus:text-[var(--color-danger-600)]"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Tags and Status row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Status badge - instructor only */}
            {isActuallyInstructor && (
              <Badge
                variant={material.status === "published" ? "default" : "outline"}
                className={cn(
                  "text-xs",
                  material.status === "published"
                    ? "bg-[var(--color-success-500)] text-white hover:bg-[var(--color-success-600)]"
                    : "border-[var(--color-warning-500)] text-[var(--color-warning-600)]"
                )}
              >
                {material.status === "published" ? "Published" : "Draft"}
              </Badge>
            )}

            {/* Tag badges */}
            {material.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {material.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{material.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
            {/* Author */}
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={material.author.avatarUrl ?? undefined}
                  alt={material.author.name}
                />
                <AvatarFallback className="text-[10px]">
                  {getInitials(material.author.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[100px]">{material.author.name}</span>
            </div>

            {/* Read time */}
            <span>{material.readTimeMinutes} min read</span>

            {/* Q&A count */}
            {material.qaCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{material.qaCount}</span>
              </div>
            )}

            {/* Updated date */}
            <time dateTime={material.updatedAt}>{formatDate(material.updatedAt)}</time>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Material</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[var(--color-foreground)]">
                {material.title}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] dark:bg-[var(--color-danger-950)] p-3 rounded-md">
              This action cannot be undone. The material and all associated Q&A
              threads will be permanently deleted.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
