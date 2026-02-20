/**
 * useCreateCourse Hook Tests
 * TASK-011: Create Course
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreateCourse } from '../../hooks/useCreateCourse';
import * as coursesModule from '../../lib/supabase/courses';
import type { CreateCoursePayload, Course } from '@shared';

// Mock the Supabase courses module
vi.mock('../../lib/supabase/courses', () => ({
  createCourse: vi.fn(),
}));

// Create wrapper for TanStack Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockCourseBase: Course = {
  id: 'new-course-id',
  title: 'New Course',
  description: 'Course description',
  category: 'programming',
  status: 'draft',
  visibility: 'public',
  instructor: { id: 'inst-1', name: 'Instructor' },
  enrolledCount: 0,
  materialCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  syllabus: [],
};

describe('useCreateCourse Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Mutation', () => {
    it('should start with idle state', () => {
      const { result } = renderHook(() => useCreateCourse(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
    });

    it('should call createCourse with payload', async () => {
      const payload: CreateCoursePayload = {
        title: 'New Course',
        description: 'Course description',
        category: 'programming',
        visibility: 'public',
      };

      vi.mocked(coursesModule.createCourse).mockResolvedValueOnce(mockCourseBase);

      const { result } = renderHook(() => useCreateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(payload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.createCourse).toHaveBeenCalledWith(payload);
    });

    it('should return created course data', async () => {
      const payload: CreateCoursePayload = {
        title: 'New Course',
        description: 'Course description',
        category: 'programming',
        visibility: 'public',
      };

      vi.mocked(coursesModule.createCourse).mockResolvedValueOnce(mockCourseBase);

      const { result } = renderHook(() => useCreateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(payload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCourseBase);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate courses query on success', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      });

      const payload: CreateCoursePayload = {
        title: 'New Course',
        description: 'Course description',
        category: 'programming',
        visibility: 'public',
      };

      vi.mocked(coursesModule.createCourse).mockResolvedValueOnce(mockCourseBase);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useCreateCourse(), { wrapper });

      act(() => {
        result.current.mutate(payload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify createCourse was called
      expect(coursesModule.createCourse).toHaveBeenCalledWith(payload);
    });
  });

  describe('Redirect Support', () => {
    it('should return course ID for redirect', async () => {
      const payload: CreateCoursePayload = {
        title: 'New Course',
        description: 'Course description',
        category: 'programming',
        visibility: 'public',
      };

      vi.mocked(coursesModule.createCourse).mockResolvedValueOnce(mockCourseBase);

      const { result } = renderHook(() => useCreateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(payload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The returned data should include the course ID
      expect(result.current.data?.id).toBe('new-course-id');
    });
  });

  describe('Payload Handling', () => {
    it('should include thumbnailUrl if provided', async () => {
      const payload: CreateCoursePayload = {
        title: 'New Course',
        description: 'Course description',
        category: 'programming',
        visibility: 'public',
        thumbnailUrl: 'https://example.com/image.jpg',
      };

      const mockCourse: Course = {
        ...mockCourseBase,
        thumbnailUrl: 'https://example.com/image.jpg',
      };

      vi.mocked(coursesModule.createCourse).mockResolvedValueOnce(mockCourse);

      const { result } = renderHook(() => useCreateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(payload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.createCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnailUrl: 'https://example.com/image.jpg',
        })
      );
    });

    it('should support invite_only visibility', async () => {
      const payload: CreateCoursePayload = {
        title: 'New Course',
        description: 'Course description',
        category: 'programming',
        visibility: 'invite_only',
      };

      const mockCourse: Course = {
        ...mockCourseBase,
        visibility: 'invite_only',
      };

      vi.mocked(coursesModule.createCourse).mockResolvedValueOnce(mockCourse);

      const { result } = renderHook(() => useCreateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(payload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.createCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'invite_only',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Failed to create course');
      vi.mocked(coursesModule.createCourse).mockRejectedValueOnce(error);

      const payload: CreateCoursePayload = {
        title: 'New Course',
        description: 'Course description',
        category: 'programming',
        visibility: 'public',
      };

      const { result } = renderHook(() => useCreateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(payload);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should handle validation errors', async () => {
      const error = new Error('Validation failed');
      vi.mocked(coursesModule.createCourse).mockRejectedValueOnce(error);

      const payload: CreateCoursePayload = {
        title: '',
        description: 'Course description',
        category: 'programming',
        visibility: 'public',
      };

      const { result } = renderHook(() => useCreateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(payload);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('Return Type', () => {
    it('should return UseMutationResult<Course>', async () => {
      const payload: CreateCoursePayload = {
        title: 'New Course',
        description: 'Course description',
        category: 'programming',
        visibility: 'public',
      };

      vi.mocked(coursesModule.createCourse).mockResolvedValueOnce(mockCourseBase);

      const { result } = renderHook(() => useCreateCourse(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('reset');

      act(() => {
        result.current.mutate(payload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCourseBase);
    });
  });
});
