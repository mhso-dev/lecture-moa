/**
 * CourseSearchBar Component Tests
 * TASK-019: Search input with 300ms debounce
 *
 * Note: These tests verify component behavior with controlled input handling.
 * React 19 + Vitest has known issues with fireEvent.change on controlled inputs.
 * Tests use URL params mocking to simulate initial state where applicable.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CourseSearchBar } from '../../../components/course/CourseSearchBar';

// Mock useRouter
const mockPush = vi.fn();
const mockReplace = vi.fn();

// Store for URL params
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/courses',
}));

describe('CourseSearchBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('Basic Rendering', () => {
    it('should render search input', () => {
      render(<CourseSearchBar />);

      const input = screen.getByPlaceholderText(/search/i);
      expect(input).toBeInTheDocument();
    });

    it('should have search icon', () => {
      render(<CourseSearchBar />);

      const searchIcon = screen.getByTestId('search-icon');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should sync with URL params', () => {
      // The initial query is set from searchParams.get("q") || ""
      // Since our mock returns empty URLSearchParams, the value should be empty
      render(<CourseSearchBar />);

      const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should have correct accessibility attributes', () => {
      render(<CourseSearchBar />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-label', 'Search courses');
    });
  });

  describe('Debounce Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce input by 300ms', async () => {
      const onSearchChange = vi.fn();
      render(<CourseSearchBar onSearchChange={onSearchChange} />);

      const input = screen.getByPlaceholderText(/search/i);

      fireEvent.change(input, { target: { value: 'typescript' } });

      // Should not call immediately
      expect(onSearchChange).not.toHaveBeenCalled();

      // Fast forward 299ms - still not called
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(onSearchChange).not.toHaveBeenCalled();

      // Fast forward 1 more ms - should be called now
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onSearchChange).toHaveBeenCalledWith('typescript');
    });
  });

  describe('Clear Button with Initial Value', () => {
    it('should show clear button when input has initial value from URL', () => {
      // Set initial search params to simulate URL with query
      mockSearchParams = new URLSearchParams('q=test');

      render(<CourseSearchBar />);

      // Clear button should appear because there's an initial value
      expect(screen.getByTestId('clear-button')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', () => {
      // Set initial search params to simulate URL with query
      mockSearchParams = new URLSearchParams('q=test');

      render(<CourseSearchBar />);

      const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      expect(input.value).toBe('test');

      const clearButton = screen.getByTestId('clear-button');
      fireEvent.click(clearButton);

      // Input should be cleared
      expect(input.value).toBe('');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard focus', () => {
      render(<CourseSearchBar />);

      const input = screen.getByPlaceholderText(/search/i);

      // Focus should work
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('should clear input on Escape when initialized with value', () => {
      // Set initial search params to simulate URL with query
      mockSearchParams = new URLSearchParams('q=test');

      render(<CourseSearchBar />);

      const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      expect(input.value).toBe('test');

      // Escape should clear
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(input.value).toBe('');
    });
  });

  describe('No Clear Button', () => {
    it('should not show clear button when input is empty', () => {
      render(<CourseSearchBar />);

      expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
    });
  });
});
