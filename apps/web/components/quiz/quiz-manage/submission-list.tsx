/**
 * SubmissionList Component
 * REQ-FE-651: Student submission list for instructor view
 *
 * Displays list of student submissions with scores, pass/fail status,
 * and export CSV functionality.
 */

"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Download, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import type { QuizSubmissionSummary } from "@shared";

interface SubmissionListProps {
  submissions: QuizSubmissionSummary[];
  onViewDetails?: (attemptId: string) => void;
  onSort?: (column: string) => void;
  passingScore?: number;
  className?: string;
  testId?: string;
}

/**
 * Format submission timestamp for display
 */
function formatSubmittedAt(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generate CSV content from submissions
 */
function generateCSV(submissions: QuizSubmissionSummary[]): string {
  const headers = ["Student Name", "Score", "Percentage", "Status", "Submitted At"];
  const rows = submissions.map((sub) => [
    sub.userName,
    String(sub.score),
    `${String(sub.percentage)}%`,
    sub.passed === null ? "Pending" : sub.passed ? "Passed" : "Failed",
    formatSubmittedAt(sub.submittedAt),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Handle CSV export
 */
function handleExportCSV(submissions: QuizSubmissionSummary[], filename = "submissions.csv") {
  const csv = generateCSV(submissions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Pass/Fail badge component
 */
function StatusBadge({ passed }: { passed: boolean | null }) {
  if (passed === null) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        Pending
      </Badge>
    );
  }

  return passed ? (
    <Badge variant="default" className="bg-green-600">
      Passed
    </Badge>
  ) : (
    <Badge variant="destructive">Failed</Badge>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground">No submissions yet</p>
    </div>
  );
}

export function SubmissionList({
  submissions,
  onViewDetails,
  onSort,
  passingScore,
  className,
  testId,
}: SubmissionListProps) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
    onSort?.(column);
  };

  // Sort submissions client-side
  const sortedSubmissions = React.useMemo(() => {
    if (!sortColumn) return submissions;

    return [...submissions].sort((a, b) => {
      let comparison = 0;

      if (sortColumn === "score") {
        comparison = a.percentage - b.percentage;
      } else if (sortColumn === "submittedAt") {
        comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [submissions, sortColumn, sortDirection]);

  // Empty state
  if (submissions.length === 0) {
    return (
      <div className={cn("rounded-lg border", className)} data-testid={testId}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={className} data-testid={testId}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Submissions ({submissions.length})</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { handleExportCSV(submissions) }}
        >
          <Download className="h-4 w-4 mr-2" data-testid="download-icon" />
          Export CSV
        </Button>
      </CardHeader>

      <CardContent>
        {/* Header row */}
        <div className="flex items-center gap-4 py-3 border-b font-medium text-sm text-muted-foreground">
          <div className="flex-1">Student</div>
          <div
            className="w-24 text-center cursor-pointer hover:text-foreground"
            onClick={() => { handleSort("score") }}
          >
            Score
            {sortColumn === "score" && (
              sortDirection === "asc" ? (
                <ChevronUp className="inline h-4 w-4 ml-1" data-testid="chevron-up-icon" />
              ) : (
                <ChevronDown className="inline h-4 w-4 ml-1" data-testid="chevron-icon" />
              )
            )}
          </div>
          <div className="w-24 text-center">Status</div>
          <div
            className="w-40 cursor-pointer hover:text-foreground"
            onClick={() => { handleSort("submittedAt") }}
          >
            Submitted
            {sortColumn === "submittedAt" && (
              sortDirection === "asc" ? (
                <ChevronUp className="inline h-4 w-4 ml-1" data-testid="chevron-up-icon" />
              ) : (
                <ChevronDown className="inline h-4 w-4 ml-1" data-testid="chevron-icon" />
              )
            )}
          </div>
          <div className="w-28 text-right">Actions</div>
        </div>

        {/* Submission rows */}
        <div className="divide-y">
          {sortedSubmissions.map((submission) => (
            <div
              key={submission.attemptId}
              className="flex items-center gap-4 py-4"
            >
              {/* Student name */}
              <div className="flex-1 font-medium">{submission.userName}</div>

              {/* Score */}
              <div className="w-24 text-center">
                <span className="text-lg font-semibold">{submission.percentage}%</span>
              </div>

              {/* Status */}
              <div className="w-24 text-center">
                <StatusBadge passed={submission.passed} />
              </div>

              {/* Submitted at */}
              <div className="w-40 text-sm text-muted-foreground">
                {formatSubmittedAt(submission.submittedAt)}
              </div>

              {/* Actions */}
              <div className="w-28 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails?.(submission.attemptId)}
                >
                  View Details
                  <ExternalLink className="h-4 w-4 ml-1" data-testid="external-link-icon" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Passing score info */}
        {passingScore !== undefined && (
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            Passing score: {passingScore}%
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
