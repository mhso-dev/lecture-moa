/**
 * useCourses Hook Tests
 * TASK-005: List with Pagination
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCourses } from '../../hooks/useCourses';
import { api } from '../../lib/api';
import type { PaginatedCourseList, CourseListParams } from '@shared';

// Mock the API module
vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
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

describe('useCourses Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Query', () => {
    it('should fetch course list with default params', async () => {
      const mockResponse: PaginatedCourseList = {
        data: [
          {
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
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockResponse,
        success: true,
      });

      const { result } = renderHook(() => useCourses(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(api.get).toHaveBeenCalledWith('/api/v1/courses', {
        params: undefined,
      });
    });

    it('should fetch course list with pagination params', async () => {
      const params: CourseListParams = {
        page: 2,
        limit: 20,
      };

      const mockResponse: PaginatedCourseList = {
        data: [],
        total: 50,
        page: 2,
        limit: 20,
      };

      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockResponse,
        success: true,
      });

      const { result } = renderHook(() => useCourses(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.get).toHaveBeenCalledWith('/api/v1/courses', {
        params: { page: 2, limit: 20 },
      });
    });

    it('should fetch course list with search params', async () => {
      const params: CourseListParams = {
        search: 'typescript',
      };

      const mockResponse: PaginatedCourseList = {
        data: [],
        total: 5,
        page: 1,
        limit: 10,
      };

      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockResponse,
        success: true,
      });

      const { result } = renderHook(() => useCourses(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.get).toHaveBeenCalledWith('/api/v1/courses', {
        params: { search: 'typescript' },
      });
    });

    it('should fetch course list with category filter', async () => {
      const params: CourseListParams = {
        category: 'programming',
      };

      const mockResponse: PaginatedCourseList = {
        data: [],
        total: 10,
        page: 1,
        limit: 10,
      };

      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockResponse,
        success: true,
      });

      const { result } = renderHook(() => useCourses(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.get).toHaveBeenCalledWith('/api/v1/courses', {
        params: { category: 'programming' },
      });
    });

    it('should fetch course list with sort option', async () => {
      const params: CourseListParams = {
        sort: 'popular',
      };

      const mockResponse: PaginatedCourseList = {
        data: [],
        total: 10,
        page: 1,
        limit: 10,
      };

      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockResponse,
        success: true,
      });

      const { result } = renderHook(() => useCourses(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.get).toHaveBeenCalledWith('/api/v1/courses', {
        params: { sort: 'popular' },
      });
    });

    it('should fetch course list with status filter', async () => {
      const params: CourseListParams = {
        status: 'published',
      };

      const mockResponse: PaginatedCourseList = {
        data: [],
        total: 10,
        page: 1,
        limit: 10,
      };

      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockResponse,
        success: true,
      });

      const { result } = renderHook(() => useCourses(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.get).toHaveBeenCalledWith('/api/v1/courses', {
        params: { status: 'published' },
      });
    });

    it('should fetch course list with all params combined', async () => {
      const params: CourseListParams = {
        page: 1,
        limit: 10,
        search: 'react',
        category: 'programming',
        sort: 'recent',
        status: 'published',
      };

      const mockResponse: PaginatedCourseList = {
        data: [],
        total: 3,
        page: 1,
        limit: 10,
      };

      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockResponse,
        success: true,
      });

      const { result } = renderHook(() => useCourses(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.get).toHaveBeenCalledWith('/api/v1/courses', {
        params,
      });
    });
  });

  describe('Query Key', () => {
    it('should use correct query key with params', async () => {
      const params: CourseListParams = { page: 1, limit: 10 };

      vi.mocked(api.get).mockResolvedValueOnce({
        data: { data: [], total: 0, page: 1, limit: 10 },
        success: true,
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(() => useCourses(params), { wrapper });

      await waitFor(() => {
        expect(
          queryClient.getQueryData(['courses', params])
        ).toBeDefined();
      });
    });

    it('should refetch when params change', async () => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: { data: [], total: 0, page: 1, limit: 10 },
          success: true,
        })
        .mockResolvedValueOnce({
          data: { data: [], total: 0, page: 2, limit: 10 },
          success: true,
        });

      const { result, rerender } = renderHook(
        ({ params }: { params: CourseListParams }) => useCourses(params),
        {
          wrapper: createWrapper(),
          initialProps: { params: { page: 1 } },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.get).toHaveBeenCalledTimes(1);

      // Change params
      rerender({ params: { page: 2 } });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCourses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should return error on 500 response', async () => {
      const error = new Error('Internal Server Error');
      vi.mocked(api.get).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCourses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Loading States', () => {
    it('should start with loading state', () => {
      vi.mocked(api.get).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useCourses(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
    });

    it('should set isLoading to false after fetch', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { data: [], total: 0, page: 1, limit: 10 },
        success: true,
      });

      const { result } = renderHook(() => useCourses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Refetch', () => {
    it('should provide refetch function', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { data: [], total: 0, page: 1, limit: 10 },
        success: true,
      });

      const { result } = renderHook(() => useCourses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.refetch).toBeDefined();
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch data when refetch is called', async () => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: { data: [], total: 0, page: 1, limit: 10 },
          success: true,
        })
        .mockResolvedValueOnce({
          data: { data: [], total: 1, page: 1, limit: 10 },
          success: true,
        });

      const { result } = renderHook(() => useCourses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.total).toBe(0);

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data?.total).toBe(1);
      });
    });
  });
});
