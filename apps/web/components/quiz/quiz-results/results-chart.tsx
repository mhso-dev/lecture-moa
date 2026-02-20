/**
 * ResultsChart Component
 * REQ-FE-623: Results visualization with SVG donut chart
 *
 * Renders an accessible SVG donut chart showing quiz results breakdown
 * with correct, incorrect, and unanswered segments.
 */

import * as React from "react";
import { cn } from "~/lib/utils";

interface ResultsChartProps {
  correct: number;
  incorrect: number;
  unanswered: number;
  className?: string;
  size?: number;
}

export function ResultsChart({
  correct,
  incorrect,
  unanswered,
  className,
  size = 200,
}: ResultsChartProps) {
  const total = correct + incorrect + unanswered;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Calculate stroke dasharray for each segment
  const radius = (size - 20) / 2; // Leave 10px padding on each side
  const circumference = 2 * Math.PI * radius;

  const correctStroke = total > 0 ? (correct / total) * circumference : 0;
  const incorrectStroke = total > 0 ? (incorrect / total) * circumference : 0;
  const unansweredStroke = total > 0 ? (unanswered / total) * circumference : 0;

  // Calculate stroke dashoffset for positioning
  const correctOffset = 0;
  const incorrectOffset = -correctStroke;
  const unansweredOffset = -(correctStroke + incorrectStroke);

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {/* SVG Donut Chart */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${String(size)} ${String(size)}`}
        aria-hidden="true"
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="20"
        />

        {/* Correct segment - Green */}
        {correct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--chart-2, 142.1 76.2% 36.3%))"
            strokeWidth="20"
            strokeDasharray={`${String(correctStroke)} ${String(circumference)}`}
            strokeDashoffset={correctOffset}
            className="transition-all duration-500"
          />
        )}

        {/* Incorrect segment - Red */}
        {incorrect > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--destructive))"
            strokeWidth="20"
            strokeDasharray={`${String(incorrectStroke)} ${String(circumference)}`}
            strokeDashoffset={incorrectOffset}
            className="transition-all duration-500"
          />
        )}

        {/* Unanswered segment - Gray */}
        {unanswered > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="20"
            strokeDasharray={`${String(unansweredStroke)} ${String(circumference)}`}
            strokeDashoffset={unansweredOffset}
            className="transition-all duration-500"
          />
        )}

        {/* Center text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-current text-2xl font-bold"
          style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
        >
          {percentage}%
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {/* Screen reader text */}
        <span className="sr-only">
          {correct} correct, {incorrect} incorrect, {unanswered} unanswered
        </span>

        {/* Correct */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-2,142.1_76.2%_36.3%))]" />
          <span className="text-sm text-muted-foreground">Correct</span>
          <span className="ml-auto font-semibold">{correct}</span>
        </div>

        {/* Incorrect */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[hsl(var(--destructive))]" />
          <span className="text-sm text-muted-foreground">Incorrect</span>
          <span className="ml-auto font-semibold">{incorrect}</span>
        </div>

        {/* Unanswered */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[hsl(var(--muted-foreground))]" />
          <span className="text-sm text-muted-foreground">Unanswered</span>
          <span className="ml-auto font-semibold">{unanswered}</span>
        </div>
      </div>
    </div>
  );
}
