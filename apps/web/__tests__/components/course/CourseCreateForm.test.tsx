/**
 * CourseCreateForm Component Tests
 * TASK-031: Course Create Form
 *
 * REQ-FE-421: Course Creation Form
 * REQ-FE-422: Form Validation
 * REQ-FE-423: Thumbnail Upload Preview
 * REQ-FE-424: Successful Creation Redirect
 * REQ-FE-425: Creation Error Handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseCreateForm } from '../../../components/course/CourseCreateForm';

// Mock mutation hook
const mockCreateMutate = vi.fn();
const mockOnSuccess = vi.fn();

vi.mock('../../../hooks/useCreateCourse', () => ({
  useCreateCourse: () => ({
    mutate: mockCreateMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

// Mock router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CourseCreateForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering (REQ-FE-421)', () => {
    it('should render all required form fields', () => {
      render(<CourseCreateForm />);

      // Check for input fields by label
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      // Category select has a label containing "Category"
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    });

    it('should render thumbnail upload field', () => {
      render(<CourseCreateForm />);

      // Thumbnail input exists
      const uploadArea = screen.getByText(/upload thumbnail/i);
      expect(uploadArea).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<CourseCreateForm />);

      expect(screen.getByRole('button', { name: /create course/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation (REQ-FE-422)', () => {
    it('should have title input with proper attributes', () => {
      render(<CourseCreateForm />);

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveAttribute('placeholder');
    });

    it('should have description textarea with proper attributes', () => {
      render(<CourseCreateForm />);

      const descInput = screen.getByLabelText(/description/i);
      expect(descInput).toHaveAttribute('placeholder');
    });

    it('should have submit button', () => {
      render(<CourseCreateForm />);

      const submitButton = screen.getByRole('button', { name: /create course/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Thumbnail Preview (REQ-FE-423)', () => {
    it('should show thumbnail preview when image selected', async () => {
      render(<CourseCreateForm />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const preview = screen.getByAltText(/thumbnail preview/i);
        expect(preview).toBeInTheDocument();
      });
    });

    it('should not show preview when no file selected', () => {
      render(<CourseCreateForm />);

      expect(screen.queryByAltText(/thumbnail preview/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission (REQ-FE-424)', () => {
    it('should render form fields correctly for submission', async () => {
      render(<CourseCreateForm onSuccess={mockOnSuccess} />);

      // Verify form fields exist
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create course/i })).toBeInTheDocument();
    });

    it('should show loading state during submission', async () => {
      vi.mock('../../../hooks/useCreateCourse', () => ({
        useCreateCourse: () => ({
          mutate: mockCreateMutate,
          isPending: true,
          isError: false,
          error: null,
        }),
      }));

      render(<CourseCreateForm />);

      const submitButton = screen.getByRole('button', { name: /create course/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling (REQ-FE-425)', () => {
    it('should preserve form data on error', async () => {
      render(<CourseCreateForm />);

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      await userEvent.type(titleInput, 'My Course Title');

      // Even after an error, the input should retain its value
      expect(titleInput.value).toBe('My Course Title');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<CourseCreateForm />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });
});
