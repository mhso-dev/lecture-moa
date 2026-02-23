/**
 * MaterialSelector Component
 * REQ-FE-640: Material selection for AI quiz generation
 *
 * Features:
 * - Multi-select checkboxes
 * - Course grouping headers
 * - Material preview (first 100 chars)
 * - Empty state with link to materials
 */

"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { FileText, Plus, Upload } from "lucide-react";

interface Material {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  content: string;
}

interface MaterialSelectorProps {
  materials: Material[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

// Group materials by course
function groupByCourse(materials: Material[]): Map<string, Material[]> {
  const grouped = new Map<string, Material[]>();
  materials.forEach((material) => {
    const existing = grouped.get(material.courseName) ?? [];
    grouped.set(material.courseName, [...existing, material]);
  });
  return grouped;
}

// Truncate content for preview
function truncateContent(content: string, maxLength = 100): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + "...";
}

/**
 * MaterialSelector - Multi-select for course materials
 * REQ-FE-640: Supports grouping by course and previewing content
 */
export function MaterialSelector({
  materials,
  selectedIds,
  onChange,
}: MaterialSelectorProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set(materials.map((m) => m.courseName))
  );

  const groupedMaterials = groupByCourse(materials);

  const handleToggle = (materialId: string) => {
    if (selectedIds.includes(materialId)) {
      onChange(selectedIds.filter((id) => id !== materialId));
    } else {
      onChange([...selectedIds, materialId]);
    }
  };

  const handleToggleCourse = (_courseName: string, courseMaterials: Material[]) => {
    const courseMaterialIds = courseMaterials.map((m) => m.id);
    const allSelected = courseMaterialIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Deselect all materials in this course
      onChange(selectedIds.filter((id) => !courseMaterialIds.includes(id)));
    } else {
      // Select all materials in this course
      const newIds = new Set([...selectedIds, ...courseMaterialIds]);
      onChange(Array.from(newIds));
    }
  };

  const toggleCourseExpanded = (courseName: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseName)) {
      newExpanded.delete(courseName);
    } else {
      newExpanded.add(courseName);
    }
    setExpandedCourses(newExpanded);
  };

  if (materials.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">사용 가능한 자료가 없습니다</h3>
        <p className="text-sm text-muted-foreground mb-4">
          퀴즈 문항을 생성하려면 먼저 강의 자료를 업로드하세요.
        </p>
        <Link href={"/instructor/materials" as Route}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            자료 업로드
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">자료 선택</h3>
        <p className="text-sm text-muted-foreground">
          {materials.length}개 중 {selectedIds.length}개 선택됨
        </p>
      </div>

      <div className="space-y-4">
        {Array.from(groupedMaterials.entries()).map(([courseName, courseMaterials]) => {
          const courseMaterialIds = courseMaterials.map((m) => m.id);
          const allSelected = courseMaterialIds.every((id) => selectedIds.includes(id));
          const someSelected = courseMaterialIds.some((id) => selectedIds.includes(id));
          const isExpanded = expandedCourses.has(courseName);

          return (
            <div key={courseName} className="rounded-lg border">
              {/* Course Header */}
              <div className="flex items-center gap-3 p-3 bg-muted/50">
                <Checkbox
                  id={`course-${courseName}`}
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      el.dataset.state = someSelected && !allSelected ? "indeterminate" : allSelected ? "checked" : "unchecked";
                    }
                  }}
                  onCheckedChange={() => { handleToggleCourse(courseName, courseMaterials); }}
                />
                <button
                  type="button"
                  onClick={() => { toggleCourseExpanded(courseName); }}
                  className="flex-1 text-left font-medium hover:text-primary"
                >
                  {courseName} ({courseMaterials.length})
                </button>
              </div>

              {/* Materials List */}
              {isExpanded && (
                <div className="divide-y">
                  {courseMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-start gap-3 p-3 hover:bg-muted/30 cursor-pointer"
                      onClick={() => { handleToggle(material.id); }}
                    >
                      <Checkbox
                        id={material.id}
                        checked={selectedIds.includes(material.id)}
                        onCheckedChange={() => { handleToggle(material.id); }}
                        onClick={(e) => { e.stopPropagation(); }}
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={material.id}
                          className="cursor-pointer font-medium"
                        >
                          {material.title}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {truncateContent(material.content)}
                        </p>
                      </div>
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
