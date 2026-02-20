/**
 * useCourse Hook Tests
 * TASK-006: Single Course
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCourse } from '../../hooks/useCourse';
import * as coursesModule from '../../lib/supabase/courses';
import type { Course } from '@shared';

// Mock the Supabase courses module
vi.mock('../../lib/supabase/courses', () => ({
  fetchCourse: vi.fn(),
}));

// Create wrapper for TanStack Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useCourse Hook', () => {
  const mockCourse: Course = {
    id: 'course-1',
    title: 'TypeScript Fundamentals',
    description: 'Learn TypeScript from scratch',
    category: 'programming',
    status: 'published',
    visibility: 'public',
    instructor: {
      id: 'instructor-1',
      name: 'John Doe',
    },
    enrolledCount: 100,
    materialCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    syllabus: [
      {
        id: 'section-1',
        title: 'Introduction',
        order: 1,
        materials: [
          {
            id: 'material-1',
            title: 'Getting Started',
            type: 'markdown',
            order: 1,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Query', () => {
    it('should fetch single course by ID', async () => {
      vi.mocked(coursesModule.fetchCourse).mockResolvedValueOnce(mockCourse);

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCourse);
      expect(coursesModule.fetchCourse).toHaveBeenCalledWith('course-1');
    });

    it('should not fetch when courseId is empty', async () => {
      const { result } = renderHook(() => useCourse(''), {
        wrapper: createWrapper(),
      });

      // Should not be loading, query is disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(coursesModule.fetchCourse).not.toHaveBeenCalled();
    });

    it('should not fetch when courseId is undefined', async () => {
      const { result } = renderHook(() => useCourse(undefined as unknown as string), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(coursesModule.fetchCourse).not.toHaveBeenCalled();
    });
  });

  describe('Query Key', () => {
    it('should use correct query key with courseId', async () => {
      vi.mocked(coursesModule.fetchCourse).mockResolvedValueOnce(mockCourse);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(() => useCourse('course-1'), { wrapper });

      await waitFor(() => {
        expect(
          queryClient.getQueryData(['course', 'course-1'])
        ).toBeDefined();
      });
    });

    it('should fetch different course when courseId changes', async () => {
      vi.mocked(coursesModule.fetchCourse)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce({ ...mockCourse, id: 'course-2', title: 'Another Course' });

      const { result, rerender } = renderHook(
        ({ courseId }: { courseId: string }) => useCourse(courseId),
        {
          wrapper: createWrapper(),
          initialProps: { courseId: 'course-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.id).toBe('course-1');

      // Change courseId
      rerender({ courseId: 'course-2' });

      await waitFor(() => {
        expect(result.current.data?.id).toBe('course-2');
      });

      expect(coursesModule.fetchCourse).toHaveBeenCalledTimes(2);
      expect(coursesModule.fetchCourse).toHaveBeenNthCalledWith(1, 'course-1');
      expect(coursesModule.fetchCourse).toHaveBeenNthCalledWith(2, 'course-2');
    });
  });

  describe('404 Handling', () => {
    it('should handle 404 not found gracefully', async () => {
      const notFoundError = new Error('Course not found');
      vi.mocked(coursesModule.fetchCourse).mockRejectedValueOnce(notFoundError);

      const { result } = renderHook(() => useCourse('non-existent'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(notFoundError);
    });

    it('should not refetch on 404 error', async () => {
      const notFoundError = new Error('Course not found');
      vi.mocked(coursesModule.fetchCourse).mockRejectedValue(notFoundError);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 0,
          },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useCourse('non-existent'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // fetchCourse should only be called once (no retries due to retry: false)
      expect(coursesModule.fetchCourse).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const error = new Error('Network error');
      vi.mocked(coursesModule.fetchCourse).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should handle 500 server errors', async () => {
      const serverError = new Error('Internal Server Error');
      vi.mocked(coursesModule.fetchCourse).mockRejectedValueOnce(serverError);

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(serverError);
    });

    it('should handle 403 forbidden errors', async () => {
      const forbiddenError = new Error('Access denied');
      vi.mocked(coursesModule.fetchCourse).mockRejectedValueOnce(forbiddenError);

      const { result } = renderHook(() => useCourse('private-course'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(forbiddenError);
    });
  });

  describe('Loading States', () => {
    it('should start with loading state', () => {
      vi.mocked(coursesModule.fetchCourse).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should set isLoading to false after successful fetch', async () => {
      vi.mocked(coursesModule.fetchCourse).mockResolvedValueOnce(mockCourse);

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should set isLoading to false after error', async () => {
      vi.mocked(coursesModule.fetchCourse).mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('Refetch', () => {
    it('should provide refetch function', async () => {
      vi.mocked(coursesModule.fetchCourse).mockResolvedValueOnce(mockCourse);

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.refetch).toBeDefined();
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch course data when refetch is called', async () => {
      const updatedCourse = { ...mockCourse, title: 'Updated Title' };

      vi.mocked(coursesModule.fetchCourse)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce(updatedCourse);

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.title).toBe('TypeScript Fundamentals');

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data?.title).toBe('Updated Title');
      });
    });
  });

  describe('Course Data Structure', () => {
    it('should include syllabus in course data', async () => {
      vi.mocked(coursesModule.fetchCourse).mockResolvedValueOnce(mockCourse);

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.syllabus).toBeDefined();
      expect(result.current.data?.syllabus).toHaveLength(1);
      expect(result.current.data?.syllabus[0]?.title).toBe('Introduction');
    });

    it('should include instructor info', async () => {
      vi.mocked(coursesModule.fetchCourse).mockResolvedValueOnce(mockCourse);

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.instructor).toEqual({
        id: 'instructor-1',
        name: 'John Doe',
      });
    });

    it('should include invite code for course owner', async () => {
      const courseWithInviteCode: Course = {
        ...mockCourse,
        inviteCode: 'INVITE123',
      };

      vi.mocked(coursesModule.fetchCourse).mockResolvedValueOnce(courseWithInviteCode);

      const { result } = renderHook(() => useCourse('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.inviteCode).toBe('INVITE123');
    });
  });
});
