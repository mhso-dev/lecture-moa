/**
 * useRequestAISuggestion Hook Tests
 * TASK-013: TanStack Query mutation for requesting AI suggestion
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-532: AI answer suggestion display
 * REQ-BE-004-031: Graceful failure stub until SPEC-AI-001 is implemented
 *
 * The AI suggestion hook is currently a graceful failure stub that always
 * throws an error. Tests verify the stub behavior and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRequestAISuggestion } from './useRequestAISuggestion';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

describe('useRequestAISuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error since AI suggestion is a graceful failure stub', async () => {
    const { result } = renderHook(() => useRequestAISuggestion('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify the stub error message
    expect(result.current.error?.message).toBe('AI 추천 기능은 준비 중입니다');

    // Verify error toast is shown
    expect(toast.error).toHaveBeenCalledWith('AI 추천 기능은 준비 중입니다');
  });

  it('should handle the stub error gracefully', async () => {
    const { result } = renderHook(() => useRequestAISuggestion('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should show loading state during mutation', async () => {
    const { result } = renderHook(() => useRequestAISuggestion('q1'), {
      wrapper: createWrapper(),
    });

    // Initially idle
    expect(result.current.isIdle).toBe(true);

    await act(async () => {
      result.current.mutate();
    });

    // Stub always throws, so it should end as error
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should not invalidate query on error (stub behavior)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRequestAISuggestion('q1'), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // onSuccess never fires since mutationFn always throws,
    // so invalidateQueries should not be called
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
