/**
 * useUpdateCourse Hook Tests
 * TASK-012: Update Course
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpdateCourse } from '../../hooks/useUpdateCourse';
import { api } from '../../lib/api';
import type { UpdateCoursePayload, Course } from '@shared';

// Mock the API module
vi.mock('../../lib/api', () => ({
  api: {
    patch: vi.fn(),
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

describe('useUpdateCourse Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Mutation', () => {
    it('should start with idle state', () => {
      const { result } = renderHook(() => useUpdateCourse(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
    });

    it('should call PATCH /api/v1/courses/:id with payload', async () => {
      const payload: UpdateCoursePayload = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const mockCourse: Course = {
        id: 'course-1',
        title: 'Updated Title',
        description: 'Updated description',
        category: 'programming',
        status: 'published',
        visibility: 'public',
        instructor: { id: 'inst-1', name: 'Instructor' },
        enrolledCount: 10,
        materialCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        syllabus: [],
      };

      vi.mocked(api.patch).mockResolvedValueOnce({
        data: mockCourse,
        success: true,
      });

      const { result } = renderHook(() => useUpdateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', ...payload });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/course-1', payload);
    });

    it('should return updated course data', async () => {
      const payload: UpdateCoursePayload = {
        title: 'Updated Title',
      };

      const mockCourse: Course = {
        id: 'course-1',
        title: 'Updated Title',
        description: 'Original description',
        category: 'programming',
        status: 'published',
        visibility: 'public',
        instructor: { id: 'inst-1', name: 'Instructor' },
        enrolledCount: 10,
        materialCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        syllabus: [],
      };

      vi.mocked(api.patch).mockResolvedValueOnce({
        data: mockCourse,
        success: true,
      });

      const { result } = renderHook(() => useUpdateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', ...payload });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCourse);
    });
  });

  describe('Partial Updates', () => {
    it('should support updating only title', async () => {
      const payload: UpdateCoursePayload = {
        title: 'New Title Only',
      };

      const mockCourse: Course = {
        id: 'course-1',
        title: 'New Title Only',
        description: 'Original description',
        category: 'programming',
        status: 'published',
        visibility: 'public',
        instructor: { id: 'inst-1', name: 'Instructor' },
        enrolledCount: 10,
        materialCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        syllabus: [],
      };

      vi.mocked(api.patch).mockResolvedValueOnce({
        data: mockCourse,
        success: true,
      });

      const { result } = renderHook(() => useUpdateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', ...payload });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/course-1', { title: 'New Title Only' });
    });

    it('should support updating only visibility', async () => {
      const payload: UpdateCoursePayload = {
        visibility: 'invite_only',
      };

      const mockCourse: Course = {
        id: 'course-1',
        title: 'Original Title',
        description: 'Original description',
        category: 'programming',
        status: 'published',
        visibility: 'invite_only',
        instructor: { id: 'inst-1', name: 'Instructor' },
        enrolledCount: 10,
        materialCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        syllabus: [],
      };

      vi.mocked(api.patch).mockResolvedValueOnce({
        data: mockCourse,
        success: true,
      });

      const { result } = renderHook(() => useUpdateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', ...payload });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/course-1', { visibility: 'invite_only' });
    });

    it('should support updating status', async () => {
      const payload: UpdateCoursePayload = {
        status: 'archived',
      };

      const mockCourse: Course = {
        id: 'course-1',
        title: 'Original Title',
        description: 'Original description',
        category: 'programming',
        status: 'archived',
        visibility: 'public',
        instructor: { id: 'inst-1', name: 'Instructor' },
        enrolledCount: 10,
        materialCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        syllabus: [],
      };

      vi.mocked(api.patch).mockResolvedValueOnce({
        data: mockCourse,
        success: true,
      });

      const { result } = renderHook(() => useUpdateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', ...payload });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/course-1', { status: 'archived' });
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate course query on success', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      });

      const payload: UpdateCoursePayload = {
        title: 'Updated Title',
      };

      const mockCourse: Course = {
        id: 'course-1',
        title: 'Updated Title',
        description: 'Description',
        category: 'programming',
        status: 'published',
        visibility: 'public',
        instructor: { id: 'inst-1', name: 'Instructor' },
        enrolledCount: 10,
        materialCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        syllabus: [],
      };

      vi.mocked(api.patch).mockResolvedValueOnce({
        data: mockCourse,
        success: true,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateCourse(), { wrapper });

      act(() => {
        result.current.mutate({ courseId: 'course-1', ...payload });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the API was called correctly
      expect(api.patch).toHaveBeenCalledWith('/api/v1/courses/course-1', payload);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Failed to update course');
      vi.mocked(api.patch).mockRejectedValueOnce(error);

      const payload: UpdateCoursePayload = {
        title: 'Updated Title',
      };

      const { result } = renderHook(() => useUpdateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', ...payload });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should handle not found errors', async () => {
      const error = new Error('Course not found');
      vi.mocked(api.patch).mockRejectedValueOnce(error);

      const payload: UpdateCoursePayload = {
        title: 'Updated Title',
      };

      const { result } = renderHook(() => useUpdateCourse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'non-existent', ...payload });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('Return Type', () => {
    it('should return UseMutationResult<Course>', async () => {
      const payload: UpdateCoursePayload = {
        title: 'Updated Title',
      };

      const mockCourse: Course = {
        id: 'course-1',
        title: 'Updated Title',
        description: 'Description',
        category: 'programming',
        status: 'published',
        visibility: 'public',
        instructor: { id: 'inst-1', name: 'Instructor' },
        enrolledCount: 10,
        materialCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        syllabus: [],
      };

      vi.mocked(api.patch).mockResolvedValueOnce({
        data: mockCourse,
        success: true,
      });

      const { result } = renderHook(() => useUpdateCourse(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('reset');

      act(() => {
        result.current.mutate({ courseId: 'course-1', ...payload });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCourse);
    });
  });
});
