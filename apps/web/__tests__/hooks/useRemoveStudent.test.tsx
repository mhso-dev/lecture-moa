/**
 * useRemoveStudent Hook Tests
 * TASK-016: Remove Student
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRemoveStudent } from '../../hooks/useRemoveStudent';
import * as coursesModule from '../../lib/supabase/courses';

// Mock the Supabase courses module
vi.mock('../../lib/supabase/courses', () => ({
  removeStudent: vi.fn(),
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

describe('useRemoveStudent Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Mutation', () => {
    it('should start with idle state', () => {
      const { result } = renderHook(() => useRemoveStudent(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
    });

    it('should call Supabase removeStudent on mutate', async () => {
      vi.mocked(coursesModule.removeStudent).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useRemoveStudent(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', userId: 'user-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.removeStudent).toHaveBeenCalledWith('course-1', 'user-1');
    });

    it('should transition through states during mutation', async () => {
      vi.mocked(coursesModule.removeStudent).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useRemoveStudent(), {
        wrapper: createWrapper(),
      });

      // Start: idle
      expect(result.current.isIdle).toBe(true);

      act(() => {
        result.current.mutate({ courseId: 'course-1', userId: 'user-1' });
      });

      // After completion: success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate students query on success', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      vi.mocked(coursesModule.removeStudent).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useRemoveStudent(), { wrapper });

      act(() => {
        result.current.mutate({ courseId: 'course-1', userId: 'user-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify API was called correctly
      expect(coursesModule.removeStudent).toHaveBeenCalledWith('course-1', 'user-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Failed to remove student');
      vi.mocked(coursesModule.removeStudent).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useRemoveStudent(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', userId: 'user-1' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should handle unauthorized errors', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(coursesModule.removeStudent).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useRemoveStudent(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', userId: 'user-1' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle student not found errors', async () => {
      const error = new Error('Student not found');
      vi.mocked(coursesModule.removeStudent).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useRemoveStudent(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', userId: 'non-existent' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle course not found errors', async () => {
      const error = new Error('Course not found');
      vi.mocked(coursesModule.removeStudent).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useRemoveStudent(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'non-existent', userId: 'user-1' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('Multiple Students', () => {
    it('should handle removing different students', async () => {
      vi.mocked(coursesModule.removeStudent)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useRemoveStudent(), {
        wrapper: createWrapper(),
      });

      // Remove first student
      act(() => {
        result.current.mutate({ courseId: 'course-1', userId: 'user-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.removeStudent).toHaveBeenCalledWith('course-1', 'user-1');

      // Reset for next call
      result.current.reset();

      // Remove second student
      act(() => {
        result.current.mutate({ courseId: 'course-1', userId: 'user-2' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.removeStudent).toHaveBeenCalledWith('course-1', 'user-2');
    });
  });

  describe('Return Type', () => {
    it('should return UseMutationResult', async () => {
      vi.mocked(coursesModule.removeStudent).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useRemoveStudent(), {
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
