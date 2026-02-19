/**
 * useQADetail Hook Tests
 * TASK-006: TanStack Query hook for Q&A question detail
 * REQ-FE-503: Q&A API hook definitions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useQADetail } from './useQADetail';
import type { QAQuestion } from '@shared';

// Mock the API module
vi.mock('~/lib/api', () => ({
  api: {
    get: vi.fn(),
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
};

describe('useQADetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch question detail when questionId is provided', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: mockQuestion,
      success: true,
    });

    const { result } = renderHook(() => useQADetail('q1'), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API call
    expect(api.get).toHaveBeenCalledWith('/api/v1/qa/questions/q1');

    // Verify response data
    expect(result.current.data).toEqual(mockQuestion);
  });

  it('should not fetch when questionId is empty', async () => {
    const { result } = renderHook(() => useQADetail(''), {
      wrapper: createWrapper(),
    });

    // Should not be loading or fetching
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('should not fetch when questionId is null', async () => {
    const { result } = renderHook(() => useQADetail(null as unknown as string), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Question not found');
    vi.mocked(api.get).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useQADetail('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should have correct query key structure', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: mockQuestion,
      success: true,
    });

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
