/**
 * CourseSyllabus Component
 * TASK-024: Ordered sections with materials, collapsible sections
 *
 * REQ-FE-411: Syllabus/Outline Section
 * REQ-FE-412: Material List in Course Context
 */

"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { ChevronDown, FileText, Video, HelpCircle, Check } from "lucide-react";
import { cn } from "~/lib/utils";
import type { CourseSyllabusSection, CourseMaterialSummary } from "@shared";

interface CourseSyllabusProps {
  syllabus: CourseSyllabusSection[];
  completedMaterialIds?: string[];
}

/**
 * Material type icon mapping
 */
const MaterialIcon = ({ type }: { type: CourseMaterialSummary["type"] }) => {
  switch (type) {
    case "video":
      return (
        <Video
          data-testid="material-icon-video"
          className="h-4 w-4 text-[var(--color-primary-600)]"
        />
      );
    case "quiz":
      return (
        <HelpCircle
          data-testid="material-icon-quiz"
          className="h-4 w-4 text-[var(--color-warning-600)]"
        />
      );
    case "markdown":
    default:
      return (
        <FileText
          data-testid="material-icon-markdown"
          className="h-4 w-4 text-[var(--color-info-600)]"
        />
      );
  }
};

/**
 * CourseSyllabus - Collapsible sections with materials
 */
export function CourseSyllabus({
  syllabus,
  completedMaterialIds = [],
}: CourseSyllabusProps) {
  // All sections expanded by default
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(syllabus.map((s) => s.id))
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  if (syllabus.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-[var(--color-muted-foreground)]">
            아직 커리큘럼이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {syllabus.map((section) => {
        const isExpanded = expandedSections.has(section.id);

        return (
          <Card key={section.id} data-testid={`syllabus-section-${String(section.order)}`}>
            <Collapsible open={isExpanded} onOpenChange={() => { toggleSection(section.id); }}>
              <CardHeader className="py-3">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between px-0 hover:bg-transparent"
                    aria-label={`섹션 ${String(section.order)} 토글`}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-sm font-semibold text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)] dark:text-[var(--color-primary-100)]">
                        {section.order}
                      </span>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </div>
                    <ChevronDown
                      data-testid="chevron-icon"
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded ? "rotate-180" : "rotate-0"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-3">
                  <ul className="space-y-2 ml-9">
                    {section.materials.map((material) => {
                      const isCompleted = completedMaterialIds.includes(material.id);

                      return (
                        <li
                          key={material.id}
                          className={cn(
                            "flex items-center gap-3 py-2 px-3 rounded-md",
                            isCompleted
                              ? "bg-[var(--color-success-50)] dark:bg-[var(--color-success-950)]"
                              : "hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-900)]"
                          )}
                        >
                          <MaterialIcon type={material.type} />
                          <span
                            className={cn(
                              "flex-1 text-sm",
                              isCompleted && "text-[var(--color-muted-foreground)]"
                            )}
                          >
                            {material.title}
                          </span>
                          {isCompleted && (
                            <Check
                              data-testid="completion-checkmark"
                              className="h-4 w-4 text-[var(--color-success-600)]"
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
