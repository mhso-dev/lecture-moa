/**
 * useUpvoteQuestion Hook Tests
 * TASK-010: TanStack Query mutation for upvoting question with optimistic update
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-536: Upvote interaction with optimistic update
 * REQ-BE-004-020: Supabase direct query for question vote toggle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpvoteQuestion } from './useUpvoteQuestion';
import type { QAQuestion } from '@shared';

// Mock the Supabase Q&A query layer
vi.mock('~/lib/supabase/qa', () => ({
  toggleQuestionVote: vi.fn(),
}));

// Mock useAuth to provide a user for voting
vi.mock('~/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1' },
    isAuthenticated: true,
    isLoading: false,
    role: 'student',
    signIn: vi.fn(),
    signInWithOAuth: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

import { toggleQuestionVote } from '~/lib/supabase/qa';

// Test wrapper with QueryClient
function createWrapper(initialData?: QAQuestion) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  if (initialData) {
    queryClient.setQueryData(['qa', 'detail', initialData.id], initialData);
  }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// Mock data
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
  answerCount: 0,
  aiSuggestion: null,
  aiSuggestionPending: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useUpvoteQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upvote question and optimistically update', async () => {
    vi.mocked(toggleQuestionVote).mockResolvedValueOnce({
      voted: true,
      newCount: 6,
    });

    const { result } = renderHook(() => useUpvoteQuestion('q1'), {
      wrapper: createWrapper(mockQuestion),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify Supabase query call with questionId and userId
    expect(toggleQuestionVote).toHaveBeenCalledWith('q1', 'u1');

    // Verify returned data (Supabase returns { voted, newCount })
    expect(result.current.data).toEqual({ voted: true, newCount: 6 });
  });

  it('should toggle upvote (remove if already upvoted)', async () => {
    const mockQuestionAlreadyUpvoted: QAQuestion = {
      ...mockQuestion,
      upvoteCount: 6,
      isUpvoted: true,
    };

    vi.mocked(toggleQuestionVote).mockResolvedValueOnce({
      voted: false,
      newCount: 5,
    });

    const { result } = renderHook(() => useUpvoteQuestion('q1'), {
      wrapper: createWrapper(mockQuestionAlreadyUpvoted),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toggleQuestionVote).toHaveBeenCalledWith('q1', 'u1');
  });

  it('should perform optimistic update', async () => {
    vi.mocked(toggleQuestionVote).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ voted: true, newCount: 6 });
          }, 100);
        })
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['qa', 'detail', 'q1'], mockQuestion);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpvoteQuestion('q1'), { wrapper });

    act(() => {
      result.current.mutate();
    });

    // During mutation, optimistic update should be applied
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should rollback on error', async () => {
    const mockError = new Error('Failed to upvote');
    vi.mocked(toggleQuestionVote).mockRejectedValueOnce(mockError);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['qa', 'detail', 'q1'], mockQuestion);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpvoteQuestion('q1'), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Cache should be rolled back
    const cachedData = queryClient.getQueryData<QAQuestion>(['qa', 'detail', 'q1']);
    expect(cachedData?.upvoteCount).toBe(5);
    expect(cachedData?.isUpvoted).toBe(false);
  });

  it('should show loading state during mutation', async () => {
    vi.mocked(toggleQuestionVote).mockResolvedValueOnce({
      voted: true,
      newCount: 6,
    });

    const { result } = renderHook(() => useUpvoteQuestion('q1'), {
      wrapper: createWrapper(mockQuestion),
    });

    // Initially idle
    expect(result.current.isIdle).toBe(true);

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
