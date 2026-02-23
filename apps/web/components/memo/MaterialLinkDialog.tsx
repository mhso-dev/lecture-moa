/* eslint-disable @typescript-eslint/restrict-template-expressions */
/**
 * MaterialLinkDialog Component
 * REQ-FE-766: Three-step material picker dialog
 *
 * Features:
 * - Step 1: Select course from dropdown
 * - Step 2: Select material from list within course
 * - Step 3 (optional): Select section/heading anchor from TOC
 * - "Link" button sets materialId and anchorId on form
 * - "Clear Link" button removes existing link
 * - Displays selected link as "{materialTitle} > {anchorText}"
 */

"use client";

import { useState, useEffect } from "react";
import { FileText, ChevronRight, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import type { MemoLinkTarget } from "@shared/types/memo.types";

/**
 * Course type for dialog
 */
interface Course {
  id: string;
  name: string;
}

/**
 * Material type for dialog
 */
interface Material {
  id: string;
  title: string;
  courseId: string;
}

/**
 * Table of Contents item (heading/section)
 */
interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Props for MaterialLinkDialog component
 */
interface MaterialLinkDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Current link target (if any) */
  currentLink?: MemoLinkTarget | null;
  /** Callback when link is selected */
  onLink: (materialId: string, anchorId: string | null) => void;
  /** Callback when link is cleared */
  onClear: () => void;
  /** Available courses */
  courses: Course[];
  /** Available materials */
  materials: Material[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * MaterialLinkDialog - Three-step material picker
 * REQ-FE-766: Select course -> material -> anchor
 *
 * @param props - Component props
 * @returns MaterialLinkDialog component
 *
 * @example
 * ```tsx
 * <MaterialLinkDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   currentLink={linkTarget}
 *   onLink={handleLink}
 *   onClear={handleClear}
 *   courses={userCourses}
 *   materials={allMaterials}
 * />
 * ```
 */
export function MaterialLinkDialog({
  open,
  onOpenChange,
  currentLink,
  onLink,
  onClear,
  courses,
  materials,
  className,
}: MaterialLinkDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);

  // Mock TOC data (would come from API in production)
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  // Initialize from current link
  useEffect(() => {
    if (currentLink && open) {
      setSelectedCourseId(currentLink.courseId);
      setSelectedMaterialId(currentLink.materialId);
      setSelectedAnchorId(currentLink.anchorId);
      setStep(3);

      // Mock TOC fetch
      setTocItems([
        { id: "intro", text: "Introduction", level: 2 },
        { id: "getting-started", text: "Getting Started", level: 2 },
        { id: "installation", text: "Installation", level: 3 },
        { id: "configuration", text: "Configuration", level: 3 },
        { id: "advanced", text: "Advanced Topics", level: 2 },
      ]);
    } else if (!open) {
      // Reset on close
      setStep(1);
      setSelectedCourseId("");
      setSelectedMaterialId("");
      setSelectedAnchorId(null);
      setTocItems([]);
    }
  }, [currentLink, open]);

  // Filter materials by selected course
  const filteredMaterials = selectedCourseId
    ? materials.filter((m) => m.courseId === selectedCourseId)
    : [];

  /**
   * Handle course selection
   */
  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedMaterialId("");
    setSelectedAnchorId(null);
    setStep(2);
  };

  /**
   * Handle material selection
   */
  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterialId(materialId);
    setSelectedAnchorId(null);

    // Fetch TOC for selected material (mock)
    setTocItems([
      { id: "section-1", text: "Section 1: Overview", level: 2 },
      { id: "section-2", text: "Section 2: Details", level: 2 },
      { id: "subsection-2-1", text: "Subsection 2.1", level: 3 },
      { id: "section-3", text: "Section 3: Examples", level: 2 },
    ]);

    setStep(3);
  };

  /**
   * Handle anchor selection (optional step)
   */
  const handleAnchorSelect = (anchorId: string | null) => {
    setSelectedAnchorId(anchorId);
  };

  /**
   * Handle link confirmation
   */
  const handleLink = () => {
    onLink(selectedMaterialId, selectedAnchorId);
    onOpenChange(false);
  };

  /**
   * Handle clear link
   */
  const handleClear = () => {
    onClear();
    onOpenChange(false);
  };

  /**
   * Render current selection summary
   */
  const renderCurrentSelection = () => {
    if (!selectedMaterialId) return null;

    const material = materials.find((m) => m.id === selectedMaterialId);
    const anchor = tocItems.find((item) => item.id === selectedAnchorId);

    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-muted)] text-sm">
        <FileText className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        <span className="truncate">{material?.title}</span>
        {anchor && (
          <>
            <ChevronRight className="h-4 w-4 text-[var(--color-muted-foreground)]" />
            <span className="truncate">{anchor.text}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[500px]", className)}>
        <DialogHeader>
          <DialogTitle>자료 연결</DialogTitle>
          <DialogDescription>
            이 메모에 연결할 강의 자료를 선택하세요. 선택적으로 특정 섹션을 지정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Selection */}
          {renderCurrentSelection()}

          {/* Step 1: Course Selection */}
          {step >= 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">1. 강의 선택</label>
              <Select
                value={selectedCourseId}
                onValueChange={handleCourseSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="강의를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 2: Material Selection */}
          {step >= 2 && selectedCourseId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">2. 자료 선택</label>
              <ScrollArea className="h-[200px] rounded-md border border-[var(--color-border)]">
                <div className="p-2 space-y-1">
                  {filteredMaterials.length === 0 ? (
                    <p className="text-sm text-[var(--color-muted-foreground)] text-center py-8">
                      이 강의에 자료가 없습니다
                    </p>
                  ) : (
                    filteredMaterials.map((material) => (
                      <button
                        key={material.id}
                        onClick={() => { handleMaterialSelect(material.id); }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                          selectedMaterialId === material.id
                            ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                            : "hover:bg-[var(--color-muted)]"
                        )}
                      >
                        {material.title}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 3: Anchor Selection (Optional) */}
          {step >= 3 && selectedMaterialId && tocItems.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                3. 섹션 선택 (선택사항)
              </label>
              <ScrollArea className="h-[150px] rounded-md border border-[var(--color-border)]">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => { handleAnchorSelect(null); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      selectedAnchorId === null
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                        : "hover:bg-[var(--color-muted)]"
                    )}
                  >
                    전체 자료 (특정 섹션 없음)
                  </button>
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { handleAnchorSelect(item.id); }}
                      style={{ paddingLeft: `${12 + (item.level - 2) * 16}px` }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        selectedAnchorId === item.id
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "hover:bg-[var(--color-muted)]"
                      )}
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {currentLink && (
            <Button variant="outline" onClick={handleClear} className="gap-2">
              <X className="h-4 w-4" />
              연결 해제
            </Button>
          )}
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>
            취소
          </Button>
          <Button onClick={handleLink} disabled={!selectedMaterialId}>
            자료 연결
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { MaterialLinkDialogProps, Course, Material, TocItem };
