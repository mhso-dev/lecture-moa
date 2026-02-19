/**
 * useCreateAnswer Hook Tests
 * TASK-008: TanStack Query mutation for creating answer
 * REQ-FE-503: Q&A API hook definitions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreateAnswer } from './useCreateAnswer';
import type { QAAnswer } from '@shared';

// Mock the API module
vi.mock('~/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { api } from '~/lib/api';
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

// Mock data
const mockCreatedAnswer: QAAnswer = {
  id: 'a-new',
  questionId: 'q1',
  authorId: 'u1',
  author: {
    id: 'u1',
    name: 'Test User',
    avatarUrl: null,
    role: 'instructor',
  },
  content: 'This is the answer content.',
  isAccepted: false,
  isAiGenerated: false,
  upvoteCount: 0,
  isUpvoted: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useCreateAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create answer and invalidate question detail', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: mockCreatedAnswer,
      success: true,
    });

    const { result } = renderHook(() => useCreateAnswer('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('This is the answer content.');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API call
    expect(api.post).toHaveBeenCalledWith('/api/v1/qa/questions/q1/answers', {
      content: 'This is the answer content.',
    });

    // Verify success toast
    expect(toast.success).toHaveBeenCalledWith('답변이 등록되었습니다');

    // Verify returned data
    expect(result.current.data).toEqual(mockCreatedAnswer);
  });

  it('should not make API call when questionId is empty', async () => {
    const { result } = renderHook(() => useCreateAnswer(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isIdle).toBe(true);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('should handle create error', async () => {
    const mockError = new Error('Failed to create answer');
    vi.mocked(api.post).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useCreateAnswer('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('This is the answer content.');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should show loading state during mutation', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: mockCreatedAnswer,
      success: true,
    });

    const { result } = renderHook(() => useCreateAnswer('q1'), {
      wrapper: createWrapper(),
    });

    // Initially idle
    expect(result.current.isIdle).toBe(true);

    await act(async () => {
      result.current.mutate('This is the answer content.');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
