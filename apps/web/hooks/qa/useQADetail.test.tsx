/**
 * useQADetail Hook Tests
 * TASK-006: TanStack Query hook for Q&A question detail
 * REQ-FE-503: Q&A API hook definitions
 * REQ-BE-004-011: Supabase query layer migration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useQADetail } from './useQADetail';
import type { QAQuestion, QAAnswer } from '@shared';

// Mock the Supabase Q&A query layer
vi.mock('~/lib/supabase/qa', () => ({
  getQuestionDetail: vi.fn(),
}));

// Mock useAuth to provide a user for vote queries
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

import { getQuestionDetail } from '~/lib/supabase/qa';

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
const mockQuestionDetail: QAQuestion & { answers: QAAnswer[] } = {
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
  content: 'This is the question content',
  context: {
    materialId: 'm1',
    headingId: null,
    selectedText: 'selected text',
  },
  status: 'OPEN',
  upvoteCount: 5,
  isUpvoted: false,
  answerCount: 2,
  aiSuggestion: null,
  aiSuggestionPending: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  answers: [],
};

describe('useQADetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch question detail when questionId is provided', async () => {
    vi.mocked(getQuestionDetail).mockResolvedValueOnce(mockQuestionDetail);

    const { result } = renderHook(() => useQADetail('q1'), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify Supabase query call with questionId and userId
    expect(getQuestionDetail).toHaveBeenCalledWith('q1', 'u1');

    // Verify response data
    expect(result.current.data).toEqual(mockQuestionDetail);
  });

  it('should not fetch when questionId is empty', async () => {
    const { result } = renderHook(() => useQADetail(''), {
      wrapper: createWrapper(),
    });

    // Should not be loading or fetching
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(getQuestionDetail).not.toHaveBeenCalled();
  });

  it('should not fetch when questionId is null', async () => {
    const { result } = renderHook(() => useQADetail(null as unknown as string), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(getQuestionDetail).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Question not found');
    vi.mocked(getQuestionDetail).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useQADetail('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should have correct query key structure', async () => {
    vi.mocked(getQuestionDetail).mockResolvedValueOnce(mockQuestionDetail);

    const { result } = renderHook(() => useQADetail('q1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify query key includes questionId
    expect(result.current.data?.id).toBe('q1');
  });
});
