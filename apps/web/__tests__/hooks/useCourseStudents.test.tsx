/**
 * useCourseStudents Hook Tests
 * TASK-008: Instructor View of Student Progress
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCourseStudents } from '../../hooks/useCourseStudents';
import { api, ApiClientError } from '../../lib/api';
import type { StudentProgress } from '@shared';

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

describe('useCourseStudents Hook', () => {
  const mockStudents: StudentProgress[] = [
    {
      userId: 'user-1',
      name: 'Alice Johnson',
      avatarUrl: 'https://example.com/avatar1.jpg',
      enrolledAt: '2024-01-01T00:00:00Z',
      progressPercent: 75,
    },
    {
      userId: 'user-2',
      name: 'Bob Smith',
      avatarUrl: 'https://example.com/avatar2.jpg',
      enrolledAt: '2024-01-02T00:00:00Z',
      progressPercent: 50,
    },
    {
      userId: 'user-3',
      name: 'Charlie Brown',
      enrolledAt: '2024-01-03T00:00:00Z',
      progressPercent: 25,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Query', () => {
    it('should fetch student list for instructor', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockStudents,
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStudents);
      expect(api.get).toHaveBeenCalledWith('/api/v1/courses/course-1/students');
    });

    it('should not fetch when courseId is empty', async () => {
      const { result } = renderHook(() => useCourseStudents(''), {
        wrapper: createWrapper(),
      });

      // Should not be loading, query is disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('should not fetch when courseId is undefined', async () => {
      const { result } = renderHook(
        () => useCourseStudents(undefined as unknown as string),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('should return empty array for course with no students', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('Query Key', () => {
    it('should use correct query key with courseId', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockStudents,
        success: true,
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(() => useCourseStudents('course-1'), { wrapper });

      await waitFor(() => {
        expect(
          queryClient.getQueryData(['course', 'course-1', 'students'])
        ).toBeDefined();
      });
    });

    it('should fetch different students when courseId changes', async () => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: mockStudents,
          success: true,
        })
        .mockResolvedValueOnce({
          data: [mockStudents[0]],
          success: true,
        });

      const { result, rerender } = renderHook(
        ({ courseId }: { courseId: string }) => useCourseStudents(courseId),
        {
          wrapper: createWrapper(),
          initialProps: { courseId: 'course-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);

      // Change courseId
      rerender({ courseId: 'course-2' });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(1);
      });

      expect(api.get).toHaveBeenCalledTimes(2);
      expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/courses/course-1/students');
      expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/courses/course-2/students');
    });
  });

  describe('Error Handling - Permission', () => {
    it('should handle 403 forbidden (not course instructor)', async () => {
      const forbiddenError = new ApiClientError(
        { code: 'FORBIDDEN', message: 'Only course instructors can view student list' },
        403
      );
      vi.mocked(api.get).mockRejectedValueOnce(forbiddenError);

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(forbiddenError);
    });

    it('should handle 401 unauthorized (not authenticated)', async () => {
      const unauthorizedError = new ApiClientError(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        401
      );
      vi.mocked(api.get).mockRejectedValueOnce(unauthorizedError);

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(unauthorizedError);
    });
  });

  describe('Error Handling - Other Errors', () => {
    it('should handle 404 course not found', async () => {
      const notFoundError = new ApiClientError(
        { code: 'NOT_FOUND', message: 'Course not found' },
        404
      );
      vi.mocked(api.get).mockRejectedValueOnce(notFoundError);

      const { result } = renderHook(() => useCourseStudents('non-existent'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(notFoundError);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should handle 500 server errors', async () => {
      const serverError = new ApiClientError(
        { code: 'INTERNAL_ERROR', message: 'Internal Server Error' },
        500
      );
      vi.mocked(api.get).mockRejectedValueOnce(serverError);

      const { result } = renderHook(() => useCourseStudents('course-1'), {
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

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should set isLoading to false after successful fetch', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockStudents,
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should set isLoading to false after error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useCourseStudents('course-1'), {
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
        data: mockStudents,
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.refetch).toBeDefined();
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch students when refetch is called', async () => {
      const updatedStudents = [...mockStudents, {
        userId: 'user-4',
        name: 'Diana Prince',
        enrolledAt: '2024-01-04T00:00:00Z',
        progressPercent: 10,
      }];

      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: mockStudents,
          success: true,
        })
        .mockResolvedValueOnce({
          data: updatedStudents,
          success: true,
        });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toHaveLength(4);
      });
    });
  });

  describe('Student Data Structure', () => {
    it('should include user ID', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockStudents,
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.userId).toBe('user-1');
    });

    it('should include student name', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockStudents,
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.name).toBe('Alice Johnson');
    });

    it('should include optional avatar URL', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockStudents,
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.avatarUrl).toBe('https://example.com/avatar1.jpg');
      // Student without avatar
      expect(result.current.data?.[2]?.avatarUrl).toBeUndefined();
    });

    it('should include enrollment timestamp', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockStudents,
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.enrolledAt).toBe('2024-01-01T00:00:00Z');
    });

    it('should include progress percentage for each student', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockStudents,
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.progressPercent).toBe(75);
      expect(result.current.data?.[1]?.progressPercent).toBe(50);
      expect(result.current.data?.[2]?.progressPercent).toBe(25);
    });

    it('should handle various progress levels', async () => {
      const variedProgress: StudentProgress[] = [
        { userId: 'user-1', name: 'Alice', enrolledAt: '2024-01-01T00:00:00Z', progressPercent: 0 },    // Just started
        { userId: 'user-2', name: 'Bob', enrolledAt: '2024-01-02T00:00:00Z', progressPercent: 50 },   // Halfway
        { userId: 'user-3', name: 'Charlie', enrolledAt: '2024-01-03T00:00:00Z', progressPercent: 100 },  // Completed
      ];

      vi.mocked(api.get).mockResolvedValueOnce({
        data: variedProgress,
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0]?.progressPercent).toBe(0);
      expect(result.current.data?.[1]?.progressPercent).toBe(50);
      expect(result.current.data?.[2]?.progressPercent).toBe(100);
    });
  });

  describe('Multiple Students', () => {
    it('should handle large student lists', async () => {
      const manyStudents: StudentProgress[] = Array.from({ length: 50 }, (_, i) => ({
        userId: `user-${i.toString()}`,
        name: `Student ${i.toString()}`,
        enrolledAt: '2024-01-01T00:00:00Z',
        progressPercent: Math.floor(Math.random() * 100),
      }));

      vi.mocked(api.get).mockResolvedValueOnce({
        data: manyStudents,
        success: true,
      });

      const { result } = renderHook(() => useCourseStudents('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(50);
    });
  });
});
