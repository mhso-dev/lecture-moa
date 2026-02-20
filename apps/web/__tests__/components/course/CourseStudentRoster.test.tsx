/**
 * CourseStudentRoster Component Tests
 * TASK-028: Student list with progress and remove button
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CourseStudentRoster } from '../../../components/course/CourseStudentRoster';
import type { StudentProgress } from '@shared';

// Mock hooks
const mockRefetch = vi.fn();
let mockStudentsData: StudentProgress[] | undefined = [
  {
    userId: 'student-1',
    name: 'Alice Johnson',
    avatarUrl: 'https://example.com/alice.jpg',
    enrolledAt: '2024-01-10T00:00:00Z',
    progressPercent: 85,
  },
  {
    userId: 'student-2',
    name: 'Bob Smith',
    avatarUrl: 'https://example.com/bob.jpg',
    enrolledAt: '2024-01-12T00:00:00Z',
    progressPercent: 50,
  },
  {
    userId: 'student-3',
    name: 'Carol White',
    enrolledAt: '2024-01-15T00:00:00Z',
    progressPercent: 100,
  },
];
let mockIsLoading = false;

vi.mock('../../../hooks/useCourseStudents', () => ({
  useCourseStudents: () => ({
    data: mockStudentsData,
    isLoading: mockIsLoading,
    refetch: mockRefetch,
  }),
}));

const mockRemoveMutate = vi.fn();
vi.mock('../../../hooks/useRemoveStudent', () => ({
  useRemoveStudent: () => ({
    mutate: mockRemoveMutate,
    isPending: false,
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockStudents: StudentProgress[] = [
  {
    userId: 'student-1',
    name: 'Alice Johnson',
    avatarUrl: 'https://example.com/alice.jpg',
    enrolledAt: '2024-01-10T00:00:00Z',
    progressPercent: 85,
  },
  {
    userId: 'student-2',
    name: 'Bob Smith',
    avatarUrl: 'https://example.com/bob.jpg',
    enrolledAt: '2024-01-12T00:00:00Z',
    progressPercent: 50,
  },
  {
    userId: 'student-3',
    name: 'Carol White',
    enrolledAt: '2024-01-15T00:00:00Z',
    progressPercent: 100,
  },
];

describe('CourseStudentRoster Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data to default
    mockStudentsData = mockStudents;
    mockIsLoading = false;
  });

  describe('Student List Rendering', () => {
    it('should render all enrolled students', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Carol White')).toBeInTheDocument();
    });

    it('should show student avatars', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      // Check for avatar fallbacks (initials) which are always rendered
      expect(screen.getByText('AJ')).toBeInTheDocument(); // Alice Johnson
      expect(screen.getByText('BS')).toBeInTheDocument(); // Bob Smith
    });

    it('should show fallback avatar for students without avatarUrl', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      // Carol has no avatar URL, should show initials fallback
      expect(screen.getByText('CW')).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('should show progress percentage for each student', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should show progress bar for each student', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBe(3);
    });

    it('should highlight completed students', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      // Carol has 100% progress
      const completedBadge = screen.getByText(/completed/i);
      expect(completedBadge).toBeInTheDocument();
    });
  });

  describe('Remove Student', () => {
    it('should show remove button for each student', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons.length).toBe(3);
    });

    it('should show confirmation dialog when remove is clicked', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      const firstButton = removeButtons[0];
      if (!firstButton) throw new Error('Remove button not found');
      fireEvent.click(firstButton);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it('should call remove mutation when confirmed', async () => {
      render(<CourseStudentRoster courseId="course-1" />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      const firstButton = removeButtons[0];
      if (!firstButton) throw new Error('Remove button not found');
      fireEvent.click(firstButton);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        // Mutation is called with data and callbacks
        expect(mockRemoveMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            courseId: 'course-1',
            userId: 'student-1',
          }),
          expect.any(Object) // callbacks object
        );
      }, { timeout: 3000 });
    });

    it('should not remove student when cancelled', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      const firstButton = removeButtons[0];
      if (!firstButton) throw new Error('Remove button not found');
      fireEvent.click(firstButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockRemoveMutate).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching', () => {
      mockStudentsData = undefined;
      mockIsLoading = true;

      render(<CourseStudentRoster courseId="course-1" />);

      // Check for skeleton elements (they have animate-pulse class)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no students', () => {
      mockStudentsData = [];
      mockIsLoading = false;

      render(<CourseStudentRoster courseId="course-1" />);

      expect(screen.getByText(/no students enrolled/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct table structure', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      // Should use table or list with proper roles
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should have accessible remove button labels', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      const removeButton = screen.getByRole('button', { name: /remove alice johnson/i });
      expect(removeButton).toBeInTheDocument();
    });

    it('should have aria-label for progress bars', () => {
      render(<CourseStudentRoster courseId="course-1" />);

      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-label');
      });
    });
  });
});
