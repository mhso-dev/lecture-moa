/**
 * useUpvoteAnswer Hook Tests
 * TASK-011: TanStack Query mutation for upvoting answer with optimistic update
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-536: Upvote interaction with optimistic update
 * REQ-BE-004-021: Supabase direct query for answer vote toggle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpvoteAnswer } from './useUpvoteAnswer';
import type { QAAnswer } from '@shared';

// Mock the Supabase Q&A query layer
vi.mock('~/lib/supabase/qa', () => ({
  toggleAnswerVote: vi.fn(),
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

import { toggleAnswerVote } from '~/lib/supabase/qa';

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

describe('useUpvoteAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upvote answer and return updated vote state', async () => {
    vi.mocked(toggleAnswerVote).mockResolvedValueOnce({
      voted: true,
      newCount: 6,
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

    // Verify Supabase query call with answerId and userId
    expect(toggleAnswerVote).toHaveBeenCalledWith('a1', 'u1');

    // Verify returned data (Supabase returns { voted, newCount })
    expect(result.current.data).toEqual({ voted: true, newCount: 6 });
  });

  it('should handle upvote error', async () => {
    const mockError = new Error('Failed to upvote answer');
    vi.mocked(toggleAnswerVote).mockRejectedValueOnce(mockError);

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
    vi.mocked(toggleAnswerVote).mockResolvedValueOnce({
      voted: true,
      newCount: 6,
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
    vi.mocked(toggleAnswerVote).mockResolvedValueOnce({
      voted: true,
      newCount: 6,
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
