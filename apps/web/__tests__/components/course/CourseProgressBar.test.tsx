/**
 * CourseProgressBar Component Tests
 * TASK-025: Visual progress bar with percentage label
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseProgressBar } from '../../../components/course/CourseProgressBar';

describe('CourseProgressBar Component', () => {
  describe('Basic Rendering', () => {
    it('should render progress bar', () => {
      render(<CourseProgressBar percent={50} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render percentage label', () => {
      render(<CourseProgressBar percent={75} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should apply correct width based on percent', () => {
      render(<CourseProgressBar percent={60} />);

      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveStyle({ width: '60%' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle 0 percent', () => {
      render(<CourseProgressBar percent={0} />);

      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveStyle({ width: '0%' });
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle 100 percent', () => {
      render(<CourseProgressBar percent={100} />);

      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveStyle({ width: '100%' });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should clamp values below 0', () => {
      render(<CourseProgressBar percent={-10} />);

      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('should clamp values above 100', () => {
      render(<CourseProgressBar percent={150} />);

      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      render(<CourseProgressBar percent={50} size="sm" />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('h-1');
    });

    it('should render default size', () => {
      render(<CourseProgressBar percent={50} size="default" />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('h-2');
    });

    it('should render large size', () => {
      render(<CourseProgressBar percent={50} size="lg" />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveClass('h-3');
    });
  });

  describe('Label Visibility', () => {
    it('should show label by default', () => {
      render(<CourseProgressBar percent={50} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      render(<CourseProgressBar percent={50} showLabel={false} />);

      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-valuenow', () => {
      render(<CourseProgressBar percent={65} />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '65');
    });

    it('should have correct aria-valuemin', () => {
      render(<CourseProgressBar percent={50} />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have correct aria-valuemax', () => {
      render(<CourseProgressBar percent={50} />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have aria-label', () => {
      render(<CourseProgressBar percent={50} />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-label', 'Course progress');
    });
  });
});
