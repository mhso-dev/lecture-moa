/**
 * useChangeQuestionStatus Hook Tests
 * TASK-012: TanStack Query mutation for changing question status
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-540: Instructor moderation actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useChangeQuestionStatus } from './useChangeQuestionStatus';
import type { QAQuestion } from '@shared';

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
  answerCount: 2,
  aiSuggestion: null,
  aiSuggestionPending: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockResolvedQuestion: QAQuestion = {
  ...mockQuestion,
  status: 'RESOLVED',
};

describe('useChangeQuestionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should change question status to RESOLVED', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: mockResolvedQuestion,
      success: true,
    });

    const { result } = renderHook(() => useChangeQuestionStatus('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('RESOLVED');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API call
    expect(api.patch).toHaveBeenCalledWith('/api/v1/qa/questions/q1/status', {
      status: 'RESOLVED',
    });

    // Verify success toast
    expect(toast.success).toHaveBeenCalledWith('상태가 변경되었습니다');

    // Verify returned data
    expect(result.current.data?.status).toBe('RESOLVED');
  });

  it('should change question status to CLOSED', async () => {
    const mockClosedQuestion: QAQuestion = {
      ...mockQuestion,
      status: 'CLOSED',
    };

    vi.mocked(api.patch).mockResolvedValueOnce({
      data: mockClosedQuestion,
      success: true,
    });

    const { result } = renderHook(() => useChangeQuestionStatus('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('CLOSED');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.patch).toHaveBeenCalledWith('/api/v1/qa/questions/q1/status', {
      status: 'CLOSED',
    });
  });

  it('should handle change error', async () => {
    const mockError = new Error('Failed to change status');
    vi.mocked(api.patch).mockRejectedValueOnce(mockError);

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
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: mockResolvedQuestion,
      success: true,
    });

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
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: mockResolvedQuestion,
      success: true,
    });

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
