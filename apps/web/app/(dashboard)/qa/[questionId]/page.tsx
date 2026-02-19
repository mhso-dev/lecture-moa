/**
 * Q&A Detail Page
 * TASK-030: Q&A detail route with Server Component
 *
 * Displays question detail with answers and AI suggestion.
 */

import { Metadata } from "next";
import { QADetailContent } from "./QAContent";

interface PageProps {
  params: Promise<{
    questionId: string;
  }>;
}

export const metadata: Metadata = {
  title: "질문 상세 - Lecture Moa",
  description: "질문과 답변을 확인하세요.",
};

/**
 * Q&A Detail Page
 *
 * Server Component that:
 * 1. Renders question with answers
 * 2. Client component handles data fetching
 */
export default async function QADetailPage({ params }: PageProps) {
  const { questionId } = await params;

  return <QADetailContent questionId={questionId} />;
}
