/**
 * CourseDangerZone Component Tests
 * TASK-035: Course Danger Zone
 *
 * REQ-FE-436: Archive Course
 * REQ-FE-437: Delete Course
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseDangerZone } from '../../../components/course/CourseDangerZone';

// Mock mutation hooks
const mockArchiveMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const mockOnArchive = vi.fn();
const mockOnDelete = vi.fn();

vi.mock('../../../hooks/useArchiveCourse', () => ({
  useArchiveCourse: () => ({
    mutate: mockArchiveMutate,
    isPending: false,
  }),
}));

vi.mock('../../../hooks/useDeleteCourse', () => ({
  useDeleteCourse: () => ({
    mutate: mockDeleteMutate,
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

// Mock router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('CourseDangerZone Component', () => {
  const defaultProps = {
    courseId: 'course-1',
    courseTitle: 'Test Course',
    onArchive: mockOnArchive,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Archive Functionality (REQ-FE-436)', () => {
    it('should render archive button', () => {
      render(<CourseDangerZone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /archive course/i })).toBeInTheDocument();
    });

    it('should show loading state during archive', async () => {
      vi.mock('../../../hooks/useArchiveCourse', () => ({
        useArchiveCourse: () => ({
          mutate: mockArchiveMutate,
          isPending: true,
        }),
      }));

      render(<CourseDangerZone {...defaultProps} />);

      const archiveButton = screen.getByRole('button', { name: /archive course/i });
      expect(archiveButton).toBeDisabled();
    });
  });

  describe('Delete Functionality (REQ-FE-437)', () => {
    it('should render delete button', () => {
      render(<CourseDangerZone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /delete course/i })).toBeInTheDocument();
    });

    it('should show confirmation dialog requiring course title', async () => {
      const user = userEvent.setup();
      render(<CourseDangerZone {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete course/i });
      await user.click(deleteButton);

      expect(screen.getByText(/type the course title/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/test course/i)).toBeInTheDocument();
    });

    it('should disable confirm button until title matches', async () => {
      const user = userEvent.setup();
      render(<CourseDangerZone {...defaultProps} />);

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /delete course/i });
      await user.click(deleteButton);

      // Confirm button should be disabled initially
      const confirmButton = screen.getByRole('button', { name: /delete permanently/i });
      expect(confirmButton).toBeDisabled();

      // Type wrong title
      const input = screen.getByPlaceholderText(/test course/i);
      await user.type(input, 'Wrong Title');
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button when title matches exactly', async () => {
      const user = userEvent.setup();
      render(<CourseDangerZone {...defaultProps} />);

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /delete course/i });
      await user.click(deleteButton);

      // Type correct title
      const input = screen.getByPlaceholderText(/test course/i);
      await user.type(input, 'Test Course');

      const confirmButton = screen.getByRole('button', { name: /delete permanently/i });
      expect(confirmButton).not.toBeDisabled();
    });

    it('should enable confirm button when title matches exactly', async () => {
      const user = userEvent.setup();
      render(<CourseDangerZone {...defaultProps} />);

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /delete course/i });
      await user.click(deleteButton);

      // Type correct title
      const input = screen.getByPlaceholderText(/test course/i);
      await user.type(input, 'Test Course');

      // Confirm button should be enabled
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete permanently/i });
        expect(confirmButton).not.toBeDisabled();
      });
    });

    it('should have cancel button in delete dialog', async () => {
      const user = userEvent.setup();
      render(<CourseDangerZone {...defaultProps} />);

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /delete course/i });
      await user.click(deleteButton);

      // Verify cancel button exists
      await waitFor(() => {
        const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
        expect(cancelButtons.length).toBeGreaterThan(0);
      });
    });

    it('should show warning about permanent deletion', async () => {
      const user = userEvent.setup();
      render(<CourseDangerZone {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete course/i });
      await user.click(deleteButton);

      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('should render in a danger-styled container', () => {
      render(<CourseDangerZone {...defaultProps} />);

      const container = screen.getByTestId('danger-zone-container');
      expect(container).toHaveClass('border-destructive');
    });

    it('should have destructive variant on delete button', () => {
      render(<CourseDangerZone {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete course/i });
      expect(deleteButton.className).toContain('destructive');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      render(<CourseDangerZone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /archive course/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete course/i })).toBeInTheDocument();
    });

    it('should have descriptive dialog content', async () => {
      const user = userEvent.setup();
      render(<CourseDangerZone {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete course/i });
      await user.click(deleteButton);

      expect(screen.getByRole('heading', { name: /delete course/i })).toBeInTheDocument();
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });
  });
});
