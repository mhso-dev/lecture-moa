/**
 * CourseSearchBar Component
 * TASK-019: Search input with 300ms debounce
 *
 * REQ-FE-402: Course Search
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "~/lib/utils";

interface CourseSearchBarProps {
  onSearchChange?: (query: string) => void;
  className?: string;
}

const DEBOUNCE_MS = 300;

/**
 * CourseSearchBar - Search input with debounce and URL sync
 */
export function CourseSearchBar({
  onSearchChange,
  className,
}: CourseSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initialQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initialQuery);
  const [showClear, setShowClear] = useState(!!initialQuery);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with URL params
  useEffect(() => {
    const urlQuery = searchParams.get("q") ?? "";
    if (urlQuery !== value) {
      setValue(urlQuery);
      setShowClear(!!urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounce and call onSearchChange
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onSearchChange?.(query);

        // Update URL params
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
          params.set("q", query);
        } else {
          params.delete("q");
        }
        router.replace(`${pathname}?${params.toString()}`);
      }, DEBOUNCE_MS);
    },
    [onSearchChange, router, searchParams, pathname]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setShowClear(!!newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setValue("");
    setShowClear(false);
    onSearchChange?.("");

    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.replace(`${pathname}?${params.toString()}`);

    // Focus back on input
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleClear();
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Search Icon */}
      <div
        data-testid="search-icon"
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
      >
        <Search className="h-4 w-4 text-[var(--color-muted-foreground)]" />
      </div>

      {/* Input */}
      <Input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label="Search courses"
        placeholder="Search courses..."
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="pl-10 pr-10"
      />

      {/* Clear Button */}
      {showClear && (
        <Button
          type="button"
          data-testid="clear-button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
