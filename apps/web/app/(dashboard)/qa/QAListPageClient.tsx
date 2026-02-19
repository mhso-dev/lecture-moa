/**
 * Q&A List Page Client Component
 * TASK-036: Notification Store Persistence
 *
 * Client component that handles notification clearing on mount.
 */

"use client";

import { useEffect } from "react";
import { useQAStore } from "~/stores/qa.store";
import { QAList } from "~/components/qa/QAList";
import { QAFilterBar } from "~/components/qa/QAFilterBar";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

/**
 * Client component for Q&A list page
 *
 * Clears all notifications when visiting Q&A list.
 */
export function QAListPageClient() {
  const clearAllNotifications = useQAStore((state) => state.clearAllNotifications);

  // Clear all notifications when visiting Q&A list
  useEffect(() => {
    clearAllNotifications();
  }, [clearAllNotifications]);

  return (
    <div className="container py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Q&A</h1>
          <p className="text-muted-foreground mt-1">
            궁금한 점을 질문하고 답변을 얻으세요.
          </p>
        </div>
        <Button asChild>
          <Link href="/qa/new">
            <Plus className="h-4 w-4 mr-2" />
            질문하기
          </Link>
        </Button>
      </div>

      {/* Filter bar */}
      <QAFilterBar className="mb-6" />

      {/* Q&A list */}
      <QAList />
    </div>
  );
}
