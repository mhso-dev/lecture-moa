/**
 * CourseCard Component Tests
 * TASK-017: Grid/list course card with progress bar
 * TASK-021: Skeleton variant for loading state
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseCard, CourseCardSkeleton } from '../../../components/course/CourseCard';
import type { CourseListItem } from '@shared';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, className }: { src: string; alt: string; fill?: boolean; className?: string }) => (
    <img src={src} alt={alt} data-fill={fill} className={className} />
  ),
}));

const mockCourse: CourseListItem = {
  id: 'course-1',
  title: 'TypeScript Fundamentals',
  description: 'Learn TypeScript from scratch with practical examples',
  category: 'programming',
  status: 'published',
  visibility: 'public',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  instructor: {
    id: 'instructor-1',
    name: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  enrolledCount: 150,
  materialCount: 12,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-20T00:00:00Z',
};

describe('CourseCard Component', () => {
  describe('Grid Variant', () => {
    it('should render course thumbnail', () => {
      render(<CourseCard course={mockCourse} variant="grid" />);

      const thumbnail = screen.getByAltText('TypeScript Fundamentals');
      expect(thumbnail).toBeInTheDocument();
    });

    it('should render course title', () => {
      render(<CourseCard course={mockCourse} variant="grid" />);

      expect(screen.getByText('TypeScript Fundamentals')).toBeInTheDocument();
    });

    it('should render instructor name', () => {
      render(<CourseCard course={mockCourse} variant="grid" />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render category badge', () => {
      render(<CourseCard course={mockCourse} variant="grid" />);

      expect(screen.getByText('programming')).toBeInTheDocument();
    });

    it('should render enrolled count', () => {
      render(<CourseCard course={mockCourse} variant="grid" />);

      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should render material count', () => {
      render(<CourseCard course={mockCourse} variant="grid" />);

      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should link to course detail page', () => {
      render(<CourseCard course={mockCourse} variant="grid" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/courses/course-1');
    });

    it('should render fallback placeholder when no thumbnail', () => {
      const courseWithoutThumbnail = { ...mockCourse, thumbnailUrl: undefined };
      render(<CourseCard course={courseWithoutThumbnail} variant="grid" />);

      // Should show a placeholder icon or text
      expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument();
    });

    it('should show progress bar when showProgress is true', () => {
      render(
        <CourseCard
          course={mockCourse}
          variant="grid"
          showProgress={true}
          progressPercent={65}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('should not show progress bar when showProgress is false', () => {
      render(<CourseCard course={mockCourse} variant="grid" showProgress={false} />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should have correct accessibility attributes', () => {
      render(<CourseCard course={mockCourse} variant="grid" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'View course: TypeScript Fundamentals');
    });
  });

  describe('List Variant', () => {
    it('should render in horizontal layout', () => {
      render(<CourseCard course={mockCourse} variant="list" />);

      const card = screen.getByTestId('course-card-list');
      expect(card).toHaveClass('flex');
    });

    it('should render course title', () => {
      render(<CourseCard course={mockCourse} variant="list" />);

      expect(screen.getByText('TypeScript Fundamentals')).toBeInTheDocument();
    });

    it('should render course description', () => {
      render(<CourseCard course={mockCourse} variant="list" />);

      expect(screen.getByText(/Learn TypeScript from scratch/)).toBeInTheDocument();
    });

    it('should show progress bar when showProgress is true', () => {
      render(
        <CourseCard
          course={mockCourse}
          variant="list"
          showProgress={true}
          progressPercent={30}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });
  });
});

describe('CourseCardSkeleton Component', () => {
  it('should render grid skeleton variant', () => {
    render(<CourseCardSkeleton variant="grid" />);

    // Should have skeleton elements for the card
    const skeletons = screen.getAllByTestId(/skeleton/);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render list skeleton variant', () => {
    render(<CourseCardSkeleton variant="list" />);

    const card = screen.getByTestId('course-card-skeleton-list');
    expect(card).toBeInTheDocument();
  });

  it('should show loading animation', () => {
    render(<CourseCardSkeleton variant="grid" />);

    const skeletons = screen.getAllByTestId(/skeleton/);
    skeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });
});
