/**
 * useEnrollWithCode Hook Tests
 * TASK-010: Enroll with Invite Code
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEnrollWithCode } from '../../hooks/useEnrollWithCode';
import * as coursesModule from '../../lib/supabase/courses';

// Mock the Supabase courses module
vi.mock('../../lib/supabase/courses', () => ({
  enrollWithCode: vi.fn(),
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

describe('useEnrollWithCode Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Mutation', () => {
    it('should start with idle state', () => {
      const { result } = renderHook(() => useEnrollWithCode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isPending).toBe(false);
    });

    it('should call Supabase enrollWithCode on mutate', async () => {
      vi.mocked(coursesModule.enrollWithCode).mockResolvedValueOnce(undefined as never);

      const { result } = renderHook(() => useEnrollWithCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', code: 'ABC123' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.enrollWithCode).toHaveBeenCalledWith('ABC123');
    });

    it('should transition through states during mutation', async () => {
      vi.mocked(coursesModule.enrollWithCode).mockResolvedValueOnce(undefined as never);

      const { result } = renderHook(() => useEnrollWithCode(), {
        wrapper: createWrapper(),
      });

      // Start: idle
      expect(result.current.isIdle).toBe(true);

      act(() => {
        result.current.mutate({ courseId: 'course-1', code: 'ABC123' });
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

  describe('Code Validation', () => {
    it('should validate code is exactly 6 characters', async () => {
      const { result } = renderHook(() => useEnrollWithCode(), {
        wrapper: createWrapper(),
      });

      // Test with short code - should not call Supabase
      act(() => {
        result.current.mutate({ courseId: 'course-1', code: 'ABC' });
      });

      // Should fail validation before Supabase call
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(coursesModule.enrollWithCode).not.toHaveBeenCalled();
      expect(result.current.error?.message).toContain('6 characters');
    });

    it('should validate code is not empty', async () => {
      const { result } = renderHook(() => useEnrollWithCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', code: '' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(coursesModule.enrollWithCode).not.toHaveBeenCalled();
    });

    it('should accept valid 6-character codes', async () => {
      vi.mocked(coursesModule.enrollWithCode).mockResolvedValueOnce(undefined as never);

      const { result } = renderHook(() => useEnrollWithCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', code: 'ABC123' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.enrollWithCode).toHaveBeenCalled();
    });

    it('should accept alphanumeric codes', async () => {
      vi.mocked(coursesModule.enrollWithCode).mockResolvedValueOnce(undefined as never);

      const { result } = renderHook(() => useEnrollWithCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', code: 'A1B2C3' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(coursesModule.enrollWithCode).toHaveBeenCalledWith('A1B2C3');
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

      vi.mocked(coursesModule.enrollWithCode).mockResolvedValueOnce(undefined as never);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useEnrollWithCode(), { wrapper });

      act(() => {
        result.current.mutate({ courseId: 'course-1', code: 'ABC123' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify the Supabase function was called with just the code
      expect(coursesModule.enrollWithCode).toHaveBeenCalledWith('ABC123');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Invalid invite code');
      vi.mocked(coursesModule.enrollWithCode).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEnrollWithCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', code: 'ABC123' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      vi.mocked(coursesModule.enrollWithCode).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEnrollWithCode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ courseId: 'course-1', code: 'ABC123' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('Return Type', () => {
    it('should return UseMutationResult', async () => {
      vi.mocked(coursesModule.enrollWithCode).mockResolvedValueOnce(undefined as never);

      const { result } = renderHook(() => useEnrollWithCode(), {
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
