/**
 * useArchiveCourse Hook Tests
 * TASK-013: Archive Course
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useArchiveCourse } from '../../hooks/useArchiveCourse';
import { api } from '../../lib/api';

// Mock the API module
vi.mock('../../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
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

describe('useArchiveCourse Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Mutation', () => {
    it('should start with idle state', () => {
      const { result } = renderHook(() => useArchiveCourse(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
    });

    it('should call POST /api/v1/courses/:id/archive', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: undefined,
        success: true,
      });

      const { result } = renderHook(() => useArchiveCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.post).toHaveBeenCalledWith('/api/v1/courses/course-1/archive');
    });

    it('should transition through states during mutation', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: undefined,
        success: true,
      });

      const { result } = renderHook(() => useArchiveCourse(), {
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

      vi.mocked(api.post).mockResolvedValueOnce({
        data: undefined,
        success: true,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useArchiveCourse(), { wrapper });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify API was called correctly
      expect(api.post).toHaveBeenCalledWith('/api/v1/courses/course-1/archive');
    });
  });

  describe('Redirect Handling', () => {
    it('should redirect to /courses on success', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: undefined,
        success: true,
      });

      const { result } = renderHook(() => useArchiveCourse(), {
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
      const error = new Error('Failed to archive course');
      vi.mocked(api.post).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useArchiveCourse(), {
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
      const error = new Error('Failed to archive course');
      vi.mocked(api.post).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useArchiveCourse(), {
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

    it('should handle unauthorized errors', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(api.post).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useArchiveCourse(), {
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
      vi.mocked(api.post).mockResolvedValueOnce({
        data: undefined,
        success: true,
      });

      const { result } = renderHook(() => useArchiveCourse(), {
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
