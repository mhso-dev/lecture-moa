/**
 * CourseFilter Component Tests
 * TASK-020: Category filter tabs and sort select dropdown
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseFilter } from '../../../components/course/CourseFilter';
import type { CourseCategory, CourseSortOption } from '@shared';

// Mock Next.js router
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/courses',
}));

describe('CourseFilter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Category Filter Tabs', () => {
    it('should render All category tab', () => {
      render(<CourseFilter />);

      expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
    });

    it('should render all category options', () => {
      render(<CourseFilter />);

      const categories: CourseCategory[] = ['programming', 'design', 'business', 'science', 'language', 'other'];

      categories.forEach((category) => {
        expect(screen.getByRole('tab', { name: new RegExp(category, 'i') })).toBeInTheDocument();
      });
    });

    it('should call onCategoryChange when category is selected', () => {
      const onCategoryChange = vi.fn();
      render(<CourseFilter onCategoryChange={onCategoryChange} />);

      const programmingTab = screen.getByRole('tab', { name: /programming/i });
      fireEvent.click(programmingTab);

      expect(onCategoryChange).toHaveBeenCalledWith('programming');
    });

    it('should call onCategoryChange with null when All is selected', () => {
      const onCategoryChange = vi.fn();
      render(<CourseFilter onCategoryChange={onCategoryChange} selectedCategory="programming" />);

      const allTab = screen.getByRole('tab', { name: /all/i });
      fireEvent.click(allTab);

      expect(onCategoryChange).toHaveBeenCalledWith(null);
    });

    it('should highlight selected category', () => {
      render(<CourseFilter selectedCategory="programming" />);

      const programmingTab = screen.getByRole('tab', { name: /programming/i });
      expect(programmingTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Sort Select Dropdown', () => {
    it('should render sort select', () => {
      render(<CourseFilter />);

      expect(screen.getByRole('combobox', { name: /sort/i })).toBeInTheDocument();
    });

    it('should render all sort options', () => {
      render(<CourseFilter />);

      const sortOptions: CourseSortOption[] = ['recent', 'popular', 'alphabetical'];

      sortOptions.forEach((option) => {
        expect(screen.getByRole('option', { name: new RegExp(option, 'i') })).toBeInTheDocument();
      });
    });

    it('should call onSortChange when sort option is selected', () => {
      const onSortChange = vi.fn();
      render(<CourseFilter onSortChange={onSortChange} />);

      const sortSelect = screen.getByRole('combobox', { name: /sort/i });
      fireEvent.click(sortSelect);

      const popularOption = screen.getByRole('option', { name: /popular/i });
      fireEvent.click(popularOption);

      expect(onSortChange).toHaveBeenCalledWith('popular');
    });

    it('should show selected sort option', () => {
      render(<CourseFilter selectedSort="popular" />);

      const sortSelect = screen.getByRole('combobox', { name: /sort/i });
      expect(sortSelect).toHaveValue('popular');
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes for tabs', () => {
      render(<CourseFilter />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveAttribute('aria-label', 'Filter by category');
    });

    it('should have correct ARIA attributes for sort select', () => {
      render(<CourseFilter />);

      const sortSelect = screen.getByRole('combobox', { name: /sort/i });
      expect(sortSelect).toHaveAttribute('aria-label', 'Sort courses');
    });

    it('should be keyboard navigable', () => {
      render(<CourseFilter />);

      const allTab = screen.getByRole('tab', { name: /all/i });
      allTab.focus();

      // Should be able to navigate with arrow keys
      fireEvent.keyDown(allTab, { key: 'ArrowRight' });
      // Next tab should be focused (this depends on implementation)
    });
  });
});
