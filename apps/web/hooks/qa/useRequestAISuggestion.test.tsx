/**
 * useRequestAISuggestion Hook Tests
 * TASK-013: TanStack Query mutation for requesting AI suggestion
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-532: AI answer suggestion display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRequestAISuggestion } from './useRequestAISuggestion';
import type { QAQuestion } from '@shared';

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
  aiSuggestionPending: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useRequestAISuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should request AI suggestion and set pending state', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: mockQuestion,
      success: true,
    });

    const { result } = renderHook(() => useRequestAISuggestion('q1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API call
    expect(api.post).toHaveBeenCalledWith(
      '/api/v1/qa/questions/q1/ai-suggest'
    );

    // Verify success toast
    expect(toast.success).toHaveBeenCalledWith('AI 답변 요청이 접수되었습니다');

    // Verify returned data has pending state
    expect(result.current.data?.aiSuggestionPending).toBe(true);
  });

  it('should handle request error', async () => {
    const mockError = new Error('Failed to request AI suggestion');
    vi.mocked(api.post).mockRejectedValueOnce(mockError);

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
    vi.mocked(api.post).mockResolvedValueOnce({
      data: mockQuestion,
      success: true,
    });

    const { result } = renderHook(() => useRequestAISuggestion('q1'), {
      wrapper: createWrapper(),
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

  it('should invalidate question detail on success', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: mockQuestion,
      success: true,
    });

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
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify detail query is invalidated
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['qa', 'detail', 'q1'],
    });
  });
});
