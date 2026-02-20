/**
 * useCourseProgress Hook Tests
 * TASK-007: Course Progress for Enrolled Students
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import { api, ApiClientError } from '../../lib/api';
import type { CourseEnrollment } from '@shared';

// Mock the API module
vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    code: string;
    statusCode: number;
    constructor(error: { code: string; message: string }, statusCode: number) {
      super(error.message);
      this.code = error.code;
      this.statusCode = statusCode;
    }
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
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useCourseProgress Hook', () => {
  const mockEnrollment: CourseEnrollment = {
    courseId: 'course-1',
    userId: 'user-1',
    enrolledAt: '2024-01-01T00:00:00Z',
    progressPercent: 45,
    completedMaterialIds: ['material-1', 'material-2', 'material-3'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Query', () => {
    it('should fetch course progress for enrolled student', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockEnrollment,
        success: true,
      });

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEnrollment);
      expect(api.get).toHaveBeenCalledWith('/api/v1/courses/course-1/progress');
    });

    it('should not fetch when courseId is empty', async () => {
      const { result } = renderHook(() => useCourseProgress(''), {
        wrapper: createWrapper(),
      });

      // Should not be loading, query is disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('should not fetch when courseId is undefined', async () => {
      const { result } = renderHook(
        () => useCourseProgress(undefined as unknown as string),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('Query Key', () => {
    it('should use correct query key with courseId', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockEnrollment,
        success: true,
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(() => useCourseProgress('course-1'), { wrapper });

      await waitFor(() => {
        expect(
          queryClient.getQueryData(['course', 'course-1', 'progress'])
        ).toBeDefined();
      });
    });

    it('should fetch different progress when courseId changes', async () => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: mockEnrollment,
          success: true,
        })
        .mockResolvedValueOnce({
          data: { ...mockEnrollment, courseId: 'course-2', progressPercent: 80 },
          success: true,
        });

      const { result, rerender } = renderHook(
        ({ courseId }: { courseId: string }) => useCourseProgress(courseId),
        {
          wrapper: createWrapper(),
          initialProps: { courseId: 'course-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.progressPercent).toBe(45);

      // Change courseId
      rerender({ courseId: 'course-2' });

      await waitFor(() => {
        expect(result.current.data?.progressPercent).toBe(80);
      });

      expect(api.get).toHaveBeenCalledTimes(2);
      expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/courses/course-1/progress');
      expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/courses/course-2/progress');
    });
  });

  describe('Error Handling - Not Enrolled', () => {
    it('should handle 404 when user is not enrolled', async () => {
      const notFoundError = new ApiClientError(
        { code: 'NOT_FOUND', message: 'Enrollment not found' },
        404
      );
      vi.mocked(api.get).mockRejectedValueOnce(notFoundError);

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(notFoundError);
    });

    it('should handle 403 forbidden (not enrolled student)', async () => {
      const forbiddenError = new ApiClientError(
        { code: 'FORBIDDEN', message: 'You are not enrolled in this course' },
        403
      );
      vi.mocked(api.get).mockRejectedValueOnce(forbiddenError);

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(forbiddenError);
    });
  });

  describe('Error Handling - Other Errors', () => {
    it('should handle network errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should handle 401 unauthorized (not authenticated)', async () => {
      const unauthorizedError = new ApiClientError(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        401
      );
      vi.mocked(api.get).mockRejectedValueOnce(unauthorizedError);

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(unauthorizedError);
    });

    it('should handle 500 server errors', async () => {
      const serverError = new ApiClientError(
        { code: 'INTERNAL_ERROR', message: 'Internal Server Error' },
        500
      );
      vi.mocked(api.get).mockRejectedValueOnce(serverError);

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(serverError);
    });
  });

  describe('Loading States', () => {
    it('should start with loading state', () => {
      vi.mocked(api.get).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should set isLoading to false after successful fetch', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockEnrollment,
        success: true,
      });

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should set isLoading to false after error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useCourseProgress('course-1'), {
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
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockEnrollment,
        success: true,
      });

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.refetch).toBeDefined();
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch progress when refetch is called', async () => {
      const updatedEnrollment = { ...mockEnrollment, progressPercent: 60 };

      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: mockEnrollment,
          success: true,
        })
        .mockResolvedValueOnce({
          data: updatedEnrollment,
          success: true,
        });

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.progressPercent).toBe(45);

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data?.progressPercent).toBe(60);
      });
    });
  });

  describe('Progress Data Structure', () => {
    it('should include enrollment timestamp', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockEnrollment,
        success: true,
      });

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.enrolledAt).toBe('2024-01-01T00:00:00Z');
    });

    it('should include progress percentage (0-100)', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockEnrollment,
        success: true,
      });

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.progressPercent).toBe(45);
      expect(result.current.data?.progressPercent).toBeGreaterThanOrEqual(0);
      expect(result.current.data?.progressPercent).toBeLessThanOrEqual(100);
    });

    it('should include completed material IDs', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockEnrollment,
        success: true,
      });

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.completedMaterialIds).toEqual([
        'material-1',
        'material-2',
        'material-3',
      ]);
    });

    it('should handle zero progress', async () => {
      const newEnrollment: CourseEnrollment = {
        ...mockEnrollment,
        progressPercent: 0,
        completedMaterialIds: [],
      };

      vi.mocked(api.get).mockResolvedValueOnce({
        data: newEnrollment,
        success: true,
      });

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.progressPercent).toBe(0);
      expect(result.current.data?.completedMaterialIds).toEqual([]);
    });

    it('should handle complete progress (100%)', async () => {
      const completedEnrollment: CourseEnrollment = {
        ...mockEnrollment,
        progressPercent: 100,
        completedMaterialIds: ['material-1', 'material-2', 'material-3', 'material-4'],
      };

      vi.mocked(api.get).mockResolvedValueOnce({
        data: completedEnrollment,
        success: true,
      });

      const { result } = renderHook(() => useCourseProgress('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.progressPercent).toBe(100);
    });
  });
});
