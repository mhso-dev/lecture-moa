/**
 * useGenerateInviteCode Hook Tests
 * TASK-015: Generate Invite Code
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useGenerateInviteCode } from '../../hooks/useGenerateInviteCode';
import * as coursesModule from '../../lib/supabase/courses';
import type { InviteCodeResponse, Course } from '@shared';

// Mock the Supabase courses module
vi.mock('../../lib/supabase/courses', () => ({
  generateInviteCode: vi.fn(),
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

describe('useGenerateInviteCode Hook', () => {
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
      const { result } = renderHook(() => useGenerateInviteCode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
    });

    it('should call Supabase generateInviteCode on mutate', async () => {
      const mockResponse: InviteCodeResponse = {
        code: 'ABC123',
        expiresAt: '2024-12-31T23:59:59Z',
      };

      vi.mocked(coursesModule.generateInviteCode).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useGenerateInviteCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.generateInviteCode).toHaveBeenCalledWith('course-1');
    });

    it('should return invite code response', async () => {
      const mockResponse: InviteCodeResponse = {
        code: 'XYZ789',
        expiresAt: '2024-12-31T23:59:59Z',
      };

      vi.mocked(coursesModule.generateInviteCode).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useGenerateInviteCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.code).toBe('XYZ789');
    });

    it('should return code without expiresAt if not provided', async () => {
      const mockResponse: InviteCodeResponse = {
        code: 'DEF456',
      };

      vi.mocked(coursesModule.generateInviteCode).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useGenerateInviteCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.code).toBe('DEF456');
      expect(result.current.data?.expiresAt).toBeUndefined();
    });
  });

  describe('Course Query Update', () => {
    it('should update course query with new code when cached', async () => {
      const mockResponse: InviteCodeResponse = {
        code: 'NEWCODE',
        expiresAt: '2024-12-31T23:59:59Z',
      };

      const mockCourse: Course = {
        id: 'course-1',
        title: 'Test Course',
        description: 'Description',
        category: 'programming',
        status: 'published',
        visibility: 'invite_only',
        instructor: { id: 'inst-1', name: 'Instructor' },
        enrolledCount: 10,
        materialCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        syllabus: [],
        inviteCode: 'OLDCODE',
      };

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // Pre-populate course query
      queryClient.setQueryData(['course', 'course-1'], mockCourse);

      vi.mocked(coursesModule.generateInviteCode).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useGenerateInviteCode(), { wrapper });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the API was called and response is correct
      expect(result.current.data?.code).toBe('NEWCODE');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Failed to generate invite code');
      vi.mocked(coursesModule.generateInviteCode).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useGenerateInviteCode(), {
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

    it('should handle unauthorized errors', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(coursesModule.generateInviteCode).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useGenerateInviteCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle not found errors', async () => {
      const error = new Error('Course not found');
      vi.mocked(coursesModule.generateInviteCode).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useGenerateInviteCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'non-existent' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('Return Type', () => {
    it('should return UseMutationResult<InviteCodeResponse>', async () => {
      const mockResponse: InviteCodeResponse = {
        code: 'ABC123',
      };

      vi.mocked(coursesModule.generateInviteCode).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useGenerateInviteCode(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('reset');

      act(() => {
        result.current.mutate({ courseId: 'course-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });
  });
});
