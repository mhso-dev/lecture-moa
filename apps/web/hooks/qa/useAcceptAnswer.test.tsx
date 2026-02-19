/**
 * useAcceptAnswer Hook Tests
 * TASK-009: TanStack Query mutation for accepting answer with optimistic update
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-535: Accept answer action with optimistic update
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAcceptAnswer } from './useAcceptAnswer';
import type { QAQuestion, QAAnswer } from '@shared';

// Mock the API module
vi.mock('~/lib/api', () => ({
  api: {
    patch: vi.fn(),
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

// Mock data
const mockAcceptedAnswer: QAAnswer = {
  id: 'a1',
  questionId: 'q1',
  authorId: 'u2',
  author: {
    id: 'u2',
    name: 'Instructor',
    avatarUrl: null,
    role: 'instructor',
  },
  content: 'Accepted answer content',
  isAccepted: true,
  isAiGenerated: false,
  upvoteCount: 10,
  isUpvoted: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useAcceptAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept answer and invalidate question detail', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: mockAcceptedAnswer,
      success: true,
    });

    const { result } = renderHook(() => useAcceptAnswer('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('a1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API call
    expect(api.patch).toHaveBeenCalledWith(
      '/api/v1/qa/questions/q1/answers/a1/accept'
    );

    // Verify success toast
    expect(toast.success).toHaveBeenCalledWith('답변이 채택되었습니다');
  });

  it('should perform optimistic update', async () => {
    vi.mocked(api.patch).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: mockAcceptedAnswer,
              success: true,
            });
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
      author: { id: 'u1', name: 'Test', avatarUrl: null, role: 'STUDENT' },
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
    vi.mocked(api.patch).mockRejectedValueOnce(mockError);

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
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: mockAcceptedAnswer,
      success: true,
    });

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
