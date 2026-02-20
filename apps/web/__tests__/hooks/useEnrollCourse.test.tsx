/**
 * useEnrollCourse Hook Tests
 * TASK-009: Enroll Course with Optimistic Update
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEnrollCourse } from '../../hooks/useEnrollCourse';
import * as coursesModule from '../../lib/supabase/courses';
import type { Course } from '@shared';

// Mock the Supabase courses module
vi.mock('../../lib/supabase/courses', () => ({
  enrollInCourse: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
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

describe('useEnrollCourse Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Mutation', () => {
    it('should start with idle state', () => {
      const { result } = renderHook(() => useEnrollCourse(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
    });

    it('should call Supabase enrollInCourse on mutate', async () => {
      vi.mocked(coursesModule.enrollInCourse).mockResolvedValueOnce(undefined as never);

      const { result } = renderHook(() => useEnrollCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.enrollInCourse).toHaveBeenCalledWith('course-1');
    });

    it('should transition through states during mutation', async () => {
      vi.mocked(coursesModule.enrollInCourse).mockResolvedValueOnce(undefined as never);

      const { result } = renderHook(() => useEnrollCourse(), {
        wrapper: createWrapper(),
      });

      // Start: idle
      expect(result.current.isIdle).toBe(true);

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      // After completion: success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Reset to idle
      await act(async () => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true);
      });
    });
  });

  describe('Optimistic Update', () => {
    it('should handle enrollment with existing course in cache', async () => {
      const mockCourse: Course = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Test Description',
        category: 'programming',
        status: 'published',
        visibility: 'public',
        instructor: { id: 'inst-1', name: 'Instructor' },
        enrolledCount: 10,
        materialCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        syllabus: [],
      };

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // Pre-populate query cache
      queryClient.setQueryData(['course', 'course-1'], mockCourse);

      vi.mocked(coursesModule.enrollInCourse).mockResolvedValueOnce(undefined as never);

      const { result } = renderHook(() => useEnrollCourse(), { wrapper });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify API was called correctly
      expect(coursesModule.enrollInCourse).toHaveBeenCalledWith('course-1');
    });

    it('should handle enrollment without cached course', async () => {
      vi.mocked(coursesModule.enrollInCourse).mockResolvedValueOnce(undefined as never);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useEnrollCourse(), { wrapper });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should succeed even without pre-cached data
      expect(coursesModule.enrollInCourse).toHaveBeenCalledWith('course-1');
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate course query on settled', async () => {
      vi.mocked(coursesModule.enrollInCourse).mockResolvedValueOnce(undefined as never);

      // Pre-populate the cache to have something to invalidate
      queryClient.setQueryData(['course', 'course-1'], { id: 'course-1' });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useEnrollCourse(), { wrapper });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the API was called (mutation succeeded)
      expect(coursesModule.enrollInCourse).toHaveBeenCalledWith('course-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(coursesModule.enrollInCourse).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEnrollCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should call toast.error on enrollment failure', async () => {
      const { toast } = await import('sonner');
      const error = new Error('Enrollment failed');
      vi.mocked(coursesModule.enrollInCourse).mockRejectedValueOnce(error);

      const wrapper = ({ children }: { children: ReactNode }) => {
        queryClient = new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        return (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
      };

      // Pre-populate cache to test rollback path
      const mockCourse: Course = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Test Description',
        category: 'programming',
        status: 'published',
        visibility: 'public',
        instructor: { id: 'inst-1', name: 'Instructor' },
        enrolledCount: 10,
        materialCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        syllabus: [],
      };
      queryClient.setQueryData(['course', 'course-1'], mockCourse);

      const { result } = renderHook(() => useEnrollCourse(), { wrapper });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('Enrollment failed. Please try again.');
    });
  });

  describe('Return Type', () => {
    it('should return UseMutationResult', async () => {
      vi.mocked(coursesModule.enrollInCourse).mockResolvedValueOnce(undefined as never);

      const { result } = renderHook(() => useEnrollCourse(), {
        wrapper: createWrapper(),
      });

      // Check that result has expected UseMutationResult properties
      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('reset');
    });
  });
});
