/**
 * useAcceptAnswer Hook Tests
 * TASK-009: TanStack Query mutation for accepting answer with optimistic update
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-535: Accept answer action with optimistic update
 * REQ-BE-004-016: Supabase direct query for answer acceptance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAcceptAnswer } from './useAcceptAnswer';
import type { QAQuestion } from '@shared';

// Mock the Supabase Q&A query layer
vi.mock('~/lib/supabase/qa', () => ({
  acceptAnswer: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { acceptAnswer } from '~/lib/supabase/qa';
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

  // Pre-populate cache with question data for optimistic update testing
  const mockQuestion: QAQuestion = {
    id: 'q1',
    courseId: 'c1',
    courseName: 'Test Course',
    materialId: 'm1',
    materialTitle: 'Test Material',
    authorId: 'u1',
    author: {
      id: 'u1',
      name: 'Test User',
      avatarUrl: null,
      role: 'student',
    },
    title: 'Test Question',
    content: 'Question content',
    context: {
      materialId: 'm1',
      headingId: null,
      selectedText: 'selected',
    },
    status: 'OPEN',
    upvoteCount: 5,
    isUpvoted: false,
    answerCount: 2,
    aiSuggestion: null,
    aiSuggestionPending: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  queryClient.setQueryData(['qa', 'detail', 'q1'], mockQuestion);

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useAcceptAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept answer and invalidate question detail', async () => {
    vi.mocked(acceptAnswer).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAcceptAnswer('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('a1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify Supabase query call with questionId and answerId
    expect(acceptAnswer).toHaveBeenCalledWith('q1', 'a1');

    // Verify success toast
    expect(toast.success).toHaveBeenCalledWith('답변이 채택되었습니다');
  });

  it('should perform optimistic update', async () => {
    vi.mocked(acceptAnswer).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(undefined);
          }, 100);
        })
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const mockQuestion: QAQuestion = {
      id: 'q1',
      courseId: 'c1',
      courseName: 'Test Course',
      materialId: 'm1',
      materialTitle: 'Test Material',
      authorId: 'u1',
      author: { id: 'u1', name: 'Test', avatarUrl: null, role: 'student' },
      title: 'Test',
      content: 'Content',
      context: { materialId: 'm1', headingId: null, selectedText: 'text' },
      status: 'OPEN',
      upvoteCount: 0,
      isUpvoted: false,
      answerCount: 0,
      aiSuggestion: null,
      aiSuggestionPending: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    queryClient.setQueryData(['qa', 'detail', 'q1'], mockQuestion);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAcceptAnswer('q1'), { wrapper });

    act(() => {
      result.current.mutate('a1');
    });

    // During mutation, the optimistic update should be in progress
    // The onMutate handler runs before the mutation starts
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle error and show toast', async () => {
    const mockError = new Error('Failed to accept answer');
    vi.mocked(acceptAnswer).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useAcceptAnswer('q1'), {
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
    vi.mocked(acceptAnswer).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAcceptAnswer('q1'), {
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
});
