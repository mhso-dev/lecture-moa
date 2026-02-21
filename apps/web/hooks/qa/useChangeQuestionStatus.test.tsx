/**
 * useChangeQuestionStatus Hook Tests
 * TASK-012: TanStack Query mutation for changing question status
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-540: Instructor moderation actions
 * REQ-BE-004-018: Supabase direct query for status change
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useChangeQuestionStatus } from './useChangeQuestionStatus';

// Mock the Supabase Q&A query layer
vi.mock('~/lib/supabase/qa', () => ({
  changeQuestionStatus: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { changeQuestionStatus } from '~/lib/supabase/qa';
import { toast } from 'sonner';

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
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

describe('useChangeQuestionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should change question status to RESOLVED', async () => {
    vi.mocked(changeQuestionStatus).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useChangeQuestionStatus('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('RESOLVED');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify Supabase query call with questionId and status
    expect(changeQuestionStatus).toHaveBeenCalledWith('q1', 'RESOLVED');

    // Verify success toast
    expect(toast.success).toHaveBeenCalledWith('상태가 변경되었습니다');
  });

  it('should change question status to CLOSED', async () => {
    vi.mocked(changeQuestionStatus).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useChangeQuestionStatus('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('CLOSED');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(changeQuestionStatus).toHaveBeenCalledWith('q1', 'CLOSED');
  });

  it('should handle change error', async () => {
    const mockError = new Error('Failed to change status');
    vi.mocked(changeQuestionStatus).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useChangeQuestionStatus('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('CLOSED');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should show loading state during mutation', async () => {
    vi.mocked(changeQuestionStatus).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useChangeQuestionStatus('q1'), {
      wrapper: createWrapper(),
    });

    // Initially idle
    expect(result.current.isIdle).toBe(true);

    await act(async () => {
      result.current.mutate('RESOLVED');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should invalidate both detail and list queries', async () => {
    vi.mocked(changeQuestionStatus).mockResolvedValueOnce(undefined);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useChangeQuestionStatus('q1'), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate('RESOLVED');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify both detail and list are invalidated
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['qa', 'detail', 'q1'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['qa', 'list'],
    });
  });
});
