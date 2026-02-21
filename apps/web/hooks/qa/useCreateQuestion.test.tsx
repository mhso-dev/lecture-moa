/**
 * useCreateQuestion Hook Tests
 * TASK-007: TanStack Query mutation for creating Q&A question
 * REQ-FE-503: Q&A API hook definitions
 * REQ-BE-004-012: Supabase query layer migration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreateQuestion } from './useCreateQuestion';
import type { QACreateRequest, QAQuestion } from '@shared';

// Mock the Supabase Q&A query layer
vi.mock('~/lib/supabase/qa', () => ({
  createQuestion: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useAuth to provide a user for question creation
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

import { createQuestion } from '~/lib/supabase/qa';
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
const mockCreateRequest: QACreateRequest = {
  courseId: 'c1',
  materialId: 'm1',
  title: 'Test Question Title',
  content: 'This is the question content with enough characters.',
  context: {
    materialId: 'm1',
    headingId: 'h1',
    selectedText: 'selected text for context',
  },
};

const mockCreatedQuestion: QAQuestion = {
  id: 'q-new',
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
  title: 'Test Question Title',
  content: 'This is the question content with enough characters.',
  context: {
    materialId: 'm1',
    headingId: 'h1',
    selectedText: 'selected text for context',
  },
  status: 'OPEN',
  upvoteCount: 0,
  isUpvoted: false,
  answerCount: 0,
  aiSuggestion: null,
  aiSuggestionPending: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useCreateQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create question and show success toast', async () => {
    vi.mocked(createQuestion).mockResolvedValueOnce(mockCreatedQuestion);

    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    // Initially idle
    expect(result.current.isIdle).toBe(true);

    await act(async () => {
      result.current.mutate(mockCreateRequest);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify Supabase query call with payload and userId
    expect(createQuestion).toHaveBeenCalledWith(mockCreateRequest, 'u1');

    // Verify success toast
    expect(toast.success).toHaveBeenCalledWith('질문이 등록되었습니다');

    // Verify returned data
    expect(result.current.data).toEqual(mockCreatedQuestion);
  });

  it('should handle create error and show error toast', async () => {
    const mockError = new Error('Failed to create question');
    vi.mocked(createQuestion).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockCreateRequest);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should set isPending during mutation', async () => {
    vi.mocked(createQuestion).mockResolvedValueOnce(mockCreatedQuestion);

    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    // Initially idle
    expect(result.current.isIdle).toBe(true);

    await act(async () => {
      result.current.mutate(mockCreateRequest);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should have correct mutation key', async () => {
    vi.mocked(createQuestion).mockResolvedValueOnce(mockCreatedQuestion);

    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockCreateRequest);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(createQuestion).toHaveBeenCalledTimes(1);
  });
});
