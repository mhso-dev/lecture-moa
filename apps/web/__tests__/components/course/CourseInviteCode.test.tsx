/**
 * CourseInviteCode Component Tests
 * TASK-029: Display code, copy button, generate new code
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CourseInviteCode } from '../../../components/course/CourseInviteCode';

// Mock hooks
const mockGenerateMutate = vi.fn();
vi.mock('../../../hooks/useGenerateInviteCode', () => ({
  useGenerateInviteCode: () => ({
    mutate: mockGenerateMutate,
    isPending: false,
  }),
}));

// Mock navigator.clipboard
const mockClipboardWrite = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockClipboardWrite,
  },
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CourseInviteCode Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Code Display', () => {
    it('should display invite code in monospace font', () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const codeDisplay = screen.getByTestId('invite-code-display');
      expect(codeDisplay).toHaveClass('font-mono');
      expect(codeDisplay).toHaveTextContent('ABC123');
    });

    it('should show placeholder when no code exists', () => {
      render(<CourseInviteCode courseId="course-1" />);

      expect(screen.getByText(/no invite code/i)).toBeInTheDocument();
    });

    it('should uppercase the code', () => {
      render(<CourseInviteCode courseId="course-1" code="abc123" />);

      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should have copy button', () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('should copy code to clipboard when copy button is clicked', async () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      expect(mockClipboardWrite).toHaveBeenCalledWith('ABC123');
    });

    it('should show success feedback after copy', async () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });

    it('should show copy icon initially', () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    });

    it('should show check icon after successful copy', async () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Generate New Code', () => {
    it('should have generate new code button', () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      expect(screen.getByRole('button', { name: /generate new/i })).toBeInTheDocument();
    });

    it('should call generate mutation when button is clicked', () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const generateButton = screen.getByRole('button', { name: /generate new/i });
      fireEvent.click(generateButton);

      expect(mockGenerateMutate).toHaveBeenCalledWith({ courseId: 'course-1' });
    });

    it('should show confirmation dialog before generating', () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const generateButton = screen.getByRole('button', { name: /generate new/i });
      fireEvent.click(generateButton);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/this will invalidate the old code/i)).toBeInTheDocument();
    });

    it('should show loading state while generating', () => {
      vi.mock('../../../hooks/useGenerateInviteCode', () => ({
        useGenerateInviteCode: () => ({
          mutate: mockGenerateMutate,
          isPending: true,
        }),
      }));

      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const generateButton = screen.getByRole('button', { name: /generate new/i });
      expect(generateButton).toBeDisabled();
    });

    it('should show generate button when no code exists', () => {
      render(<CourseInviteCode courseId="course-1" />);

      const generateButton = screen.getByRole('button', { name: /generate code/i });
      expect(generateButton).toBeInTheDocument();
    });
  });

  describe('Expiration Info', () => {
    it('should show expiration date if provided', () => {
      render(
        <CourseInviteCode
          courseId="course-1"
          code="ABC123"
          expiresAt="2024-12-31T23:59:59Z"
        />
      );

      expect(screen.getByText(/expires/i)).toBeInTheDocument();
    });

    it('should not show expiration when not provided', () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      expect(screen.queryByText(/expires/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible copy button label', () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const copyButton = screen.getByRole('button', { name: /copy invite code/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should have accessible generate button label', () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const generateButton = screen.getByRole('button', { name: /generate new invite code/i });
      expect(generateButton).toBeInTheDocument();
    });

    it('should have aria-live for code display', () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const codeDisplay = screen.getByTestId('invite-code-display');
      expect(codeDisplay).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce when code is copied', async () => {
      render(<CourseInviteCode courseId="course-1" code="ABC123" />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/copied/i);
      });
    });
  });
});
