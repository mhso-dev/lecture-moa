/**
 * CourseSearchBar Component Tests
 * TASK-019: Search input with 300ms debounce
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CourseSearchBar } from '../../../components/course/CourseSearchBar';

// Mock useRouter
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/courses',
}));

describe('CourseSearchBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('should show clear button when input has value', () => {
    render(<CourseSearchBar />);

    const input = screen.getByPlaceholderText(/search/i);

    // Initially no clear button
    expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'test' } });

    // Clear button should appear
    expect(screen.getByTestId('clear-button')).toBeInTheDocument();
  });

  it('should clear input when clear button is clicked', async () => {
    const onSearchChange = vi.fn();
    render(<CourseSearchBar onSearchChange={onSearchChange} />);

    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'test' } });
    expect(input.value).toBe('test');

    const clearButton = screen.getByTestId('clear-button');
    fireEvent.click(clearButton);

    expect(input.value).toBe('');
  });

  it('should sync with URL params', () => {
    // Override mock for this test
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush, replace: mockReplace }),
      useSearchParams: () => new URLSearchParams('q=initial'),
      usePathname: () => '/courses',
    }));

    render(<CourseSearchBar />);

    // Should show initial value from URL
    const input = screen.getByDisplayValue('initial');
    expect(input).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(<CourseSearchBar />);

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'Search courses');
  });

  it('should handle keyboard navigation', () => {
    render(<CourseSearchBar />);

    const input = screen.getByPlaceholderText(/search/i);

    // Focus should work
    input.focus();
    expect(document.activeElement).toBe(input);

    // Escape should clear
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect((input as HTMLInputElement).value).toBe('');
  });
});
