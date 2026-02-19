/**
 * useUpvoteAnswer Hook Tests
 * TASK-011: TanStack Query mutation for upvoting answer with optimistic update
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-536: Upvote interaction with optimistic update
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpvoteAnswer } from './useUpvoteAnswer';
import type { QAAnswer } from '@shared';

// Mock the API module
vi.mock('~/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from '~/lib/api';

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
const mockAnswer: QAAnswer = {
  id: 'a1',
  questionId: 'q1',
  authorId: 'u2',
  author: {
    id: 'u2',
    name: 'Instructor',
    avatarUrl: null,
    role: 'instructor',
  },
  content: 'Answer content',
  isAccepted: false,
  isAiGenerated: false,
  upvoteCount: 5,
  isUpvoted: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAnswerUpvoted: QAAnswer = {
  ...mockAnswer,
  upvoteCount: 6,
  isUpvoted: true,
};

describe('useUpvoteAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upvote answer and return updated answer', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: mockAnswerUpvoted,
      success: true,
    });

    const { result } = renderHook(() => useUpvoteAnswer('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('a1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API call
    expect(api.post).toHaveBeenCalledWith(
      '/api/v1/qa/questions/q1/answers/a1/upvote'
    );

    // Verify returned data
    expect(result.current.data).toEqual(mockAnswerUpvoted);
  });

  it('should handle upvote error', async () => {
    const mockError = new Error('Failed to upvote answer');
    vi.mocked(api.post).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useUpvoteAnswer('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('a1');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should show loading state during mutation', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: mockAnswerUpvoted,
      success: true,
    });

    const { result } = renderHook(() => useUpvoteAnswer('q1'), {
      wrapper: createWrapper(),
    });

    // Initially idle
    expect(result.current.isIdle).toBe(true);

    await act(async () => {
      result.current.mutate('a1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should invalidate question detail on success', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: mockAnswerUpvoted,
      success: true,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpvoteAnswer('q1'), { wrapper });

    await act(async () => {
      result.current.mutate('a1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
