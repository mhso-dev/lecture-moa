/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * MemoView Client Component
 * REQ-FE-770, REQ-FE-771, REQ-FE-772: Read-only memo view
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Edit, Copy, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent } from "~/components/ui/card";
import { MarkdownRenderer } from "~/components/markdown/MarkdownRenderer";
import { useMemoDetail } from "~/hooks/memo/useMemoDetail";
import { useAuthStore } from "~/stores/auth.store";

/**
 * MemoView - Read-only memo view
 * REQ-FE-770: View memo with Markdown rendering
 * REQ-FE-771: Linked material navigation
 * REQ-FE-772: Social actions (copy link, tag navigation)
 */
export function MemoView() {
  const params = useParams();
  const router = useRouter();
  const memoId = params.memoId as string;
  const user = useAuthStore((state) => state.user);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch memo data
  const { data: memoData, isLoading, isError } = useMemoDetail(memoId);

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.push("/memos" as any);
  };

  /**
   * Handle edit
   */
  const handleEdit = () => {
    router.push(`/memos/${memoId}/edit` as any);
  };

  /**
   * Handle copy link
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => { setCopiedLink(false); }, 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  /**
   * Handle tag click
   */
  const handleTagClick = (tag: string) => {
    router.push(`/memos?tags=${encodeURIComponent(tag)}` as any);
  };

  /**
   * Get author initials
   */
  const getAuthorInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Format date
   */
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "MMM d, yyyy 'at' h:mm a");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 px-4 md:px-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (isError || !memoData?.memo) {
    return (
      <div className="container max-w-4xl py-6 px-4 md:px-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">Memo not found</h2>
          <p className="text-[var(--color-muted-foreground)] mb-6">
            The memo you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={handleBack}>
            Back to Memos
          </Button>
        </div>
      </div>
    );
  }

  const { memo, linkTarget } = memoData;
  const isAuthor = memo.authorId === user?.id;

  return (
    <div className="container max-w-4xl py-6 px-4 md:px-6">
      {/* Breadcrumb / Back */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Memos
        </Button>
      </div>

      {/* Linked Material Card */}
      {linkTarget && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[var(--color-muted-foreground)]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {linkTarget.materialTitle}
                </p>
                {linkTarget.anchorText && (
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                    {linkTarget.anchorText}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  { router.push(
                    `/courses/${linkTarget.courseId}/materials/${linkTarget.materialId}${
                      linkTarget.anchorId ? `#${linkTarget.anchorId}` : ""
                    }` as any
                  ); }
                }
              >
                View Material
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memo Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold flex-1">{memo.title}</h1>

          <div className="flex items-center gap-2">
            {/* Copy Link */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>

            {/* Edit Button (author only) */}
            {isAuthor && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={memo.authorAvatarUrl} alt={memo.authorName} />
            <AvatarFallback>{getAuthorInitials(memo.authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{memo.authorName}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {formatDate(memo.createdAt)}
            </p>
          </div>
        </div>

        {/* Tags and Visibility */}
        <div className="flex items-center gap-2 flex-wrap">
          {memo.tags.length > 0 &&
            memo.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-[var(--color-secondary)]/80"
                onClick={() => { handleTagClick(tag); }}
              >
                {tag}
              </Badge>
            ))}
          <Badge variant="outline">
            {memo.visibility === "team" ? "Team Memo" : "Personal"}
          </Badge>
        </div>
      </div>

      {/* Memo Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <MarkdownRenderer content={memo.content} />
      </div>

      {/* Last Updated */}
      <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Last updated: {formatDate(memo.updatedAt)}
        </p>
      </div>
    </div>
  );
}
