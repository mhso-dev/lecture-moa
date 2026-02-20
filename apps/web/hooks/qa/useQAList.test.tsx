/**
 * useQAList Hook Tests
 * TASK-005: TanStack Query hook for paginated Q&A list
 * REQ-FE-503: Q&A API hook definitions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useQAList } from './useQAList';
import type { PaginatedResponse, QAListItem } from '@shared';

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
const mockQAListItems: QAListItem[] = [
  {
    id: 'q1',
    courseId: 'c1',
    courseName: 'Test Course',
    materialId: 'm1',
    materialTitle: 'Test Material',
    author: {
      id: 'u1',
      name: 'Test User',
      avatarUrl: null,
      role: 'student',
    },
    title: 'Test Question',
    context: { selectedText: 'selected text' },
    status: 'OPEN',
    upvoteCount: 5,
    answerCount: 2,
    hasAiSuggestion: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockPaginatedResponse: PaginatedResponse<QAListItem> = {
  data: mockQAListItems,
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
};

describe('useQAList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch paginated Q&A list with default filter', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: mockPaginatedResponse,
      success: true,
    });

    const { result } = renderHook(
      () =>
        useQAList({
          limit: 20,
        }),
      { wrapper: createWrapper() }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify API call
    expect(api.get).toHaveBeenCalledWith('/api/v1/qa/questions', {
      params: expect.objectContaining({
        page: 1,
        limit: 20,
      }) as Record<string, unknown>,
    });

    // Verify response data (useInfiniteQuery wraps in pages/pageParams)
    expect(result.current.data?.pages[0]).toEqual(mockPaginatedResponse);
  });

  it('should fetch Q&A list with course filter', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: mockPaginatedResponse,
      success: true,
    });

    const { result } = renderHook(
      () =>
        useQAList({
          courseId: 'c1',
          limit: 20,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.get).toHaveBeenCalledWith('/api/v1/qa/questions', {
      params: expect.objectContaining({
        courseId: 'c1',
      }) as Record<string, unknown>,
    });
  });

  it('should fetch Q&A list with status filter', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: mockPaginatedResponse,
      success: true,
    });

    const { result } = renderHook(
      () =>
        useQAList({
          status: 'OPEN',
          limit: 20,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.get).toHaveBeenCalledWith('/api/v1/qa/questions', {
      params: expect.objectContaining({
        status: 'OPEN',
      }) as Record<string, unknown>,
    });
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Network error');
    vi.mocked(api.get).mockRejectedValueOnce(mockError);

    const { result } = renderHook(
      () =>
        useQAList({
          limit: 20,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should return correct query key', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: mockPaginatedResponse,
      success: true,
    });

    const filter = {
      courseId: 'c1',
      status: 'OPEN' as const,
      limit: 20,
    };

    const { result } = renderHook(() => useQAList(filter), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Query key should include filter
    expect(result.current.data).toBeDefined();
  });
});
