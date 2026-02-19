/**
 * CourseEmptyState Component Tests
 * TASK-022: Empty state with illustration and CTA
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseEmptyState } from '../../../components/course/CourseEmptyState';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('CourseEmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('should render illustration', () => {
      render(<CourseEmptyState />);

      expect(screen.getByTestId('empty-illustration')).toBeInTheDocument();
    });

    it('should render empty message', () => {
      render(<CourseEmptyState />);

      expect(screen.getByText(/no courses found/i)).toBeInTheDocument();
    });

    it('should render default description', () => {
      render(<CourseEmptyState />);

      expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
    });
  });

  describe('Role-based CTA', () => {
    it('should show "Create Course" button for instructors', () => {
      render(<CourseEmptyState isInstructor={true} />);

      const createButton = screen.getByRole('button', { name: /create course/i });
      expect(createButton).toBeInTheDocument();
    });

    it('should not show "Create Course" button for students', () => {
      render(<CourseEmptyState isInstructor={false} />);

      expect(screen.queryByRole('button', { name: /create course/i })).not.toBeInTheDocument();
    });

    it('should navigate to create page when CTA is clicked', () => {
      render(<CourseEmptyState isInstructor={true} />);

      const createButton = screen.getByRole('button', { name: /create course/i });
      fireEvent.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/courses/create');
    });
  });

  describe('Search vs Empty Catalog', () => {
    it('should show search-specific message when hasSearchQuery is true', () => {
      render(<CourseEmptyState hasSearchQuery={true} />);

      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });

    it('should show catalog-specific message when hasSearchQuery is false', () => {
      render(<CourseEmptyState hasSearchQuery={false} />);

      expect(screen.getByText(/no courses yet/i)).toBeInTheDocument();
    });

    it('should show clear search button when hasSearchQuery is true', () => {
      const onClearSearch = vi.fn();
      render(<CourseEmptyState hasSearchQuery={true} onClearSearch={onClearSearch} />);

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(onClearSearch).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA role', () => {
      render(<CourseEmptyState />);

      const emptyState = screen.getByRole('status');
      expect(emptyState).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(<CourseEmptyState />);

      const emptyState = screen.getByRole('status');
      expect(emptyState).toHaveAttribute('aria-label', 'No courses available');
    });
  });
});
