"use client";

import { useCallback } from "react";
import { FileText } from "lucide-react";
import { cn } from "~/lib/utils";
import { useMaterialStore } from "~/stores/material.store";
import type { TocItem } from "@shared";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";

interface TableOfContentsProps {
  /** Array of ToC items with nested children */
  items: TocItem[];
  /** Currently active heading ID */
  activeId?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Single ToC item renderer
 */
function TocItemLink({
  item,
  activeId,
  level,
  onItemClick,
}: {
  item: TocItem;
  activeId?: string | null;
  level: number;
  onItemClick: (id: string) => void;
}) {
  const isActive = item.id === activeId;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onItemClick(item.id);

      // Scroll to heading
      const element = document.getElementById(item.id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [item.id, onItemClick]
  );

  return (
    <li className="list-none">
      <a
        href={`#${item.id}`}
        onClick={handleClick}
        className={cn(
          "block py-1.5 text-sm transition-colors duration-150",
          "hover:text-[var(--color-primary-500)]",
          level === 2 && "font-medium",
          level === 3 && "pl-3 text-[var(--color-muted-foreground)]",
          level === 4 && "pl-6 text-xs text-[var(--color-muted-foreground)]",
          isActive
            ? "text-[var(--color-primary-500)] font-medium"
            : "text-[var(--color-foreground)]"
        )}
        aria-current={isActive ? "location" : undefined}
      >
        {item.text}
      </a>
      {item.children.length > 0 && (
        <ul className="border-l border-[var(--color-border)] ml-2">
          {item.children.map((child) => (
            <TocItemLink
              key={child.id}
              item={child}
              activeId={activeId}
              level={child.level}
              onItemClick={onItemClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Desktop ToC Panel (fixed right side)
 */
function DesktopTocPanel({ items, activeId, onItemClick }: {
  items: TocItem[];
  activeId?: string | null;
  onItemClick: (id: string) => void;
}) {
  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-[240px] shrink-0 overflow-y-auto xl:block">
      <nav
        className="py-4"
        aria-label="Table of contents"
      >
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          On this page
        </h2>
        <ul className="space-y-0.5">
          {items.map((item) => (
            <TocItemLink
              key={item.id}
              item={item}
              activeId={activeId}
              level={item.level}
              onItemClick={onItemClick}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

/**
 * Mobile/Tablet ToC Button with Sheet
 */
function MobileTocSheet({ items, activeId, onItemClick, isOpen, onOpenChange }: {
  items: TocItem[];
  activeId?: string | null;
  onItemClick: (id: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 xl:hidden"
          aria-label="Open table of contents"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Contents</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[280px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Table of Contents
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6" aria-label="Table of contents">
          <ul className="space-y-0.5">
            {items.map((item) => (
              <TocItemLink
                key={item.id}
                item={item}
                activeId={activeId}
                level={item.level}
                onItemClick={(id) => {
                  onItemClick(id);
                  onOpenChange(false);
                }}
              />
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/**
 * TableOfContents Component
 * REQ-FE-316: Responsive ToC with scroll spy
 *
 * Features:
 * - Desktop (>= 1280px): fixed right panel 240px, sticky
 * - Tablet (768px-1279px): collapsible floating panel (Sheet)
 * - Mobile (< 768px): bottom sheet
 * - Nested list reflecting heading hierarchy
 * - Active item highlighted via scroll spy
 * - Click smooth scrolls to heading
 *
 * @example
 * ```tsx
 * const headings = extractHeadings(content);
 * const activeId = useScrollSpy(headings.map(h => h.id));
 *
 * <TableOfContents items={headings} activeId={activeId} />
 * ```
 */
export function TableOfContents({
  items,
  activeId,
  className,
}: TableOfContentsProps) {
  const { isTocOpen, setTocOpen, setActiveHeading } = useMaterialStore();

  const handleItemClick = useCallback(
    (id: string) => {
      setActiveHeading(id);
    },
    [setActiveHeading]
  );

  // Don't render if no items
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Desktop: Fixed panel */}
      <DesktopTocPanel
        items={items}
        activeId={activeId}
        onItemClick={handleItemClick}
      />

      {/* Mobile/Tablet: Sheet trigger button */}
      <MobileTocSheet
        items={items}
        activeId={activeId}
        onItemClick={handleItemClick}
        isOpen={isTocOpen}
        onOpenChange={setTocOpen}
      />
    </div>
  );
}
