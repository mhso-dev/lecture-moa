/**
 * CourseList Component Tests
 * TASK-018: List layout for courses
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseList } from '../../../components/course/CourseList';
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
];

describe('CourseList Component', () => {
  it('should render all courses in list layout', () => {
    render(<CourseList courses={mockCourses} />);

    expect(screen.getByText('Course 1')).toBeInTheDocument();
    expect(screen.getByText('Course 2')).toBeInTheDocument();
  });

  it('should render empty state when no courses', () => {
    render(<CourseList courses={[]} />);

    expect(screen.getByText(/no courses/i)).toBeInTheDocument();
  });

  it('should render course descriptions', () => {
    render(<CourseList courses={mockCourses} />);

    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('should pass progress data to cards', () => {
    const progressMap: Record<string, number> = {
      'course-1': 60,
    };

    render(
      <CourseList courses={mockCourses} showProgress={true} progressMap={progressMap} />
    );

    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('should use vertical stack layout', () => {
    render(<CourseList courses={mockCourses} />);

    const list = screen.getByTestId('course-list');
    expect(list).toHaveClass('flex');
    expect(list).toHaveClass('flex-col');
  });

  it('should have correct accessibility attributes', () => {
    render(<CourseList courses={mockCourses} />);

    const list = screen.getByTestId('course-list');
    expect(list).toHaveAttribute('role', 'list');
    expect(list).toHaveAttribute('aria-label', 'Course list');
  });
});
