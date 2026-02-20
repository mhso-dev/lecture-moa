/**
 * Q&A List Page
 * TASK-015: Q&A list route with Server Component and prefetch
 * TASK-036: Notification Store Persistence - clear on visit
 *
 * Displays paginated Q&A questions with filter controls.
 * Clears all pending notifications when visiting Q&A list.
 */

import { Metadata } from "next";
import { QAListPageClient } from "./QAListPageClient";

export const metadata: Metadata = {
  title: "Q&A - Lecture Moa",
  description: "질문과 답변을 통해 학습하세요.",
};

/**
 * Q&A List Page
 *
 * Server Component that:
 * 1. Renders filter bar and list
 * 2. Delegates to client component for notification clearing
 */
export default function QAListPage() {
  return <QAListPageClient />;
}
