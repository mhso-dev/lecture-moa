"use client";

import { useCallback, useRef } from "react";
import { GraduationCap, BookOpen, Check } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Role option configuration
 */
interface RoleOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "instructor",
    label: "강사",
    description: "강의를 만들고, 자료를 업로드하고, 퀴즈를 관리합니다",
    icon: <GraduationCap className="h-6 w-6" />,
  },
  {
    value: "student",
    label: "학생",
    description: "자료를 학습하고, 퀴즈를 풀고, 팀과 협업합니다",
    icon: <BookOpen className="h-6 w-6" />,
  },
];

/**
 * RoleSelector - Radio-group style role selection for registration
 *
 * Features:
 * - Card-style selection with icons
 * - ARIA radiogroup pattern
 * - Keyboard navigation (Space/Enter to select, Arrow keys to switch)
 */
interface RoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, optionValue: string) => {
      const currentIndex = ROLE_OPTIONS.findIndex(
        (opt) => opt.value === optionValue
      );

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onChange(optionValue);
        return;
      }

      let nextIndex = -1;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % ROLE_OPTIONS.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex =
          (currentIndex - 1 + ROLE_OPTIONS.length) % ROLE_OPTIONS.length;
      }

      if (nextIndex >= 0) {
        const nextOption = ROLE_OPTIONS[nextIndex];
        if (nextOption) {
          onChange(nextOption.value);
          // Focus the next option card
          const cards = containerRef.current?.querySelectorAll("[role='radio']");
          if (cards?.[nextIndex]) {
            (cards[nextIndex] as HTMLElement).focus();
          }
        }
      }
    },
    [onChange]
  );

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="역할을 선택하세요"
      className="grid grid-cols-2 gap-3"
    >
      {ROLE_OPTIONS.map((option) => {
        const isSelected = value === option.value;

        return (
          <div
            key={option.value}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected || (!value && option.value === "student") ? 0 : -1}
            onClick={() => { onChange(option.value); }}
            onKeyDown={(e) => { handleKeyDown(e, option.value); }}
            className={cn(
              "relative cursor-pointer rounded-[var(--radius-lg)] border p-4 text-center transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2",
              isSelected
                ? "border-[var(--color-primary-500)] ring-2 ring-[var(--color-primary-500)]"
                : "border-[var(--color-border)] hover:border-[var(--color-primary-500)]/50"
            )}
          >
            {isSelected && (
              <div className="absolute right-2 top-2">
                <Check className="h-4 w-4 text-[var(--color-primary-600)]" />
              </div>
            )}
            <div className="mb-2 flex justify-center text-[var(--color-primary-600)]">
              {option.icon}
            </div>
            <div className="text-sm font-medium">{option.label}</div>
            <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {option.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}
