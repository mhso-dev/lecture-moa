/**
 * CourseGrid Component Tests
 * TASK-018: Responsive grid layout for courses
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseGrid } from '../../../components/course/CourseGrid';
import type { CourseListItem } from '@shared';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const mockCourses: CourseListItem[] = [
  {
    id: 'course-1',
    title: 'Course 1',
    description: 'Description 1',
    category: 'programming',
    status: 'published',
    visibility: 'public',
    instructor: { id: 'inst-1', name: 'Instructor 1' },
    enrolledCount: 100,
    materialCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'course-2',
    title: 'Course 2',
    description: 'Description 2',
    category: 'design',
    status: 'published',
    visibility: 'public',
    instructor: { id: 'inst-2', name: 'Instructor 2' },
    enrolledCount: 50,
    materialCount: 5,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'course-3',
    title: 'Course 3',
    description: 'Description 3',
    category: 'business',
    status: 'published',
    visibility: 'public',
    instructor: { id: 'inst-3', name: 'Instructor 3' },
    enrolledCount: 25,
    materialCount: 8,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

describe('CourseGrid Component', () => {
  it('should render all courses', () => {
    render(<CourseGrid courses={mockCourses} />);

    expect(screen.getByText('Course 1')).toBeInTheDocument();
    expect(screen.getByText('Course 2')).toBeInTheDocument();
    expect(screen.getByText('Course 3')).toBeInTheDocument();
  });

  it('should render empty state when no courses', () => {
    render(<CourseGrid courses={[]} />);

    expect(screen.getByText(/no courses/i)).toBeInTheDocument();
  });

  it('should apply responsive grid classes', () => {
    render(<CourseGrid courses={mockCourses} />);

    const grid = screen.getByTestId('course-grid');
    // Check for responsive grid classes (1/2/3/4 columns)
    expect(grid).toHaveClass('grid');
  });

  it('should pass progress data to cards', () => {
    const progressMap: Record<string, number> = {
      'course-1': 50,
      'course-2': 75,
    };

    render(
      <CourseGrid courses={mockCourses} showProgress={true} progressMap={progressMap} />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    // Course 3 has no progress, should show 0% or not show progress bar
  });

  it('should not show progress when showProgress is false', () => {
    const progressMap: Record<string, number> = {
      'course-1': 50,
    };

    render(
      <CourseGrid courses={mockCourses} showProgress={false} progressMap={progressMap} />
    );

    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(<CourseGrid courses={mockCourses} />);

    const grid = screen.getByTestId('course-grid');
    expect(grid).toHaveAttribute('role', 'list');
    expect(grid).toHaveAttribute('aria-label', 'Course list');
  });
});
