/**
 * CourseSettingsForm Component Tests
 * TASK-033: Course Settings Form
 *
 * REQ-FE-431: Edit Course Information
 * REQ-FE-432: Save Settings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CourseSettingsForm } from '../../../components/course/CourseSettingsForm';
import type { Course } from '@shared';

// Mock mutation hook
const mockUpdateMutate = vi.fn();
const mockOnSuccess = vi.fn();

vi.mock('../../../hooks/useUpdateCourse', () => ({
  useUpdateCourse: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Sample course data
const mockCourse: Course = {
  id: 'course-1',
  title: 'Existing Course',
  description: 'This is an existing course description that is long enough.',
  category: 'programming',
  status: 'published',
  visibility: 'public',
  instructor: {
    id: 'user-1',
    name: 'Test Instructor',
  },
  enrolledCount: 10,
  materialCount: 5,
  syllabus: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-15T00:00:00Z',
};

describe('CourseSettingsForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Pre-population (REQ-FE-431)', () => {
    it('should pre-populate form with existing course data', () => {
      render(<CourseSettingsForm courseId="course-1" defaultValues={mockCourse} />);

      const titleInput = screen.getByLabelText(/title/i);
      const descInput = screen.getByLabelText(/description/i);

      expect((titleInput as HTMLInputElement).value).toBe('Existing Course');
      expect((descInput as HTMLTextAreaElement).value).toBe('This is an existing course description that is long enough.');
    });

    it('should show invite_only as checked when course is invite_only', () => {
      const inviteOnlyCourse = { ...mockCourse, visibility: 'invite_only' as const };
      render(<CourseSettingsForm courseId="course-1" defaultValues={inviteOnlyCourse} />);

      const inviteRadio = screen.getByRole('radio', { name: /invite only/i });
      expect(inviteRadio).toBeChecked();
    });
  });

  describe('Form Validation', () => {
    it('should have title input', () => {
      render(<CourseSettingsForm courseId="course-1" defaultValues={mockCourse} />);

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toBeInTheDocument();
    });

    it('should have description textarea', () => {
      render(<CourseSettingsForm courseId="course-1" defaultValues={mockCourse} />);

      const descInput = screen.getByLabelText(/description/i);
      expect(descInput).toBeInTheDocument();
    });
  });

  describe('Save Settings (REQ-FE-432)', () => {
    it('should render save changes button', () => {
      render(<CourseSettingsForm courseId="course-1" defaultValues={mockCourse} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should show loading state during update', () => {
      vi.mock('../../../hooks/useUpdateCourse', () => ({
        useUpdateCourse: () => ({
          mutate: mockUpdateMutate,
          isPending: true,
          isError: false,
          error: null,
        }),
      }));

      render(<CourseSettingsForm courseId="course-1" defaultValues={mockCourse} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Thumbnail Handling', () => {
    it('should display existing thumbnail if available', () => {
      const courseWithThumbnail = {
        ...mockCourse,
        thumbnailUrl: 'https://example.com/thumb.jpg',
      };
      render(<CourseSettingsForm courseId="course-1" defaultValues={courseWithThumbnail} />);

      const thumbnailPreview = screen.getByAltText(/thumbnail preview/i);
      expect(thumbnailPreview).toBeInTheDocument();
    });

    it('should update preview when new thumbnail selected', async () => {
      render(<CourseSettingsForm courseId="course-1" defaultValues={mockCourse} />);

      const fileInput = document.querySelector('input[type="file"]');
      if (!fileInput) throw new Error('File input not found');
      const file = new File(['test'], 'new-thumb.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const preview = screen.getByAltText(/thumbnail preview/i);
        expect(preview).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<CourseSettingsForm courseId="course-1" defaultValues={mockCourse} />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });
});
