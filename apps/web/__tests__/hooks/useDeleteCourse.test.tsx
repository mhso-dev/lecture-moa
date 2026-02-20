/**
 * useDeleteCourse Hook Tests
 * TASK-014: Delete Course
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDeleteCourse } from '../../hooks/useDeleteCourse';
import * as coursesModule from '../../lib/supabase/courses';

// Mock the Supabase courses module
vi.mock('../../lib/supabase/courses', () => ({
  deleteCourse: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

describe('useDeleteCourse Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Mutation', () => {
    it('should start with idle state', () => {
      const { result } = renderHook(() => useDeleteCourse(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
    });

    it('should call Supabase deleteCourse on mutate', async () => {
      vi.mocked(coursesModule.deleteCourse).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeleteCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.deleteCourse).toHaveBeenCalledWith('course-1');
    });

    it('should transition through states during mutation', async () => {
      vi.mocked(coursesModule.deleteCourse).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeleteCourse(), {
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

      vi.mocked(coursesModule.deleteCourse).mockResolvedValueOnce(undefined);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useDeleteCourse(), { wrapper });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify API was called correctly
      expect(coursesModule.deleteCourse).toHaveBeenCalledWith('course-1');
    });
  });

  describe('Redirect Handling', () => {
    it('should redirect to /courses on success', async () => {
      vi.mocked(coursesModule.deleteCourse).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeleteCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPush).toHaveBeenCalledWith('/courses');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Failed to delete course');
      vi.mocked(coursesModule.deleteCourse).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDeleteCourse(), {
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

    it('should not redirect on error', async () => {
      const error = new Error('Failed to delete course');
      vi.mocked(coursesModule.deleteCourse).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDeleteCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle not found errors', async () => {
      const error = new Error('Course not found');
      vi.mocked(coursesModule.deleteCourse).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDeleteCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'non-existent' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle unauthorized errors', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(coursesModule.deleteCourse).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDeleteCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('Return Type', () => {
    it('should return UseMutationResult', async () => {
      vi.mocked(coursesModule.deleteCourse).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeleteCourse(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('reset');
    });
  });
});
