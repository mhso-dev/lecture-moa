/**
 * useQAWebSocket Hook Tests
 * TASK-014: WebSocket subscription hook for Q&A events
 * REQ-FE-503: Q&A API hook definitions
 * REQ-FE-545: WebSocket connection for Q&A
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useQAWebSocket } from './useQAWebSocket';
import type { QAStore } from '~/stores/qa.store';

// Mock the QA store
vi.mock('~/stores/qa.store', () => ({
  useQAStore: vi.fn((selector: (state: QAStore) => unknown) => {
    const state: QAStore = {
      wsConnected: false,
      setWsConnected: vi.fn(),
      addNotification: vi.fn(),
      activeQuestionId: null,
      inlinePopup: {
        isOpen: false,
        anchorRect: null,
        context: null,
      },
      activeHighlight: null,
      pendingNotifications: [],
      // Missing QAActions
      openInlinePopup: vi.fn(),
      closeInlinePopup: vi.fn(),
      openHighlightTooltip: vi.fn(),
      closeHighlightTooltip: vi.fn(),
      setActiveQuestion: vi.fn(),
      clearActiveQuestion: vi.fn(),
      clearNotification: vi.fn(),
      clearAllNotifications: vi.fn(),
    };
    return selector(state);
  }),
}));

// Mock the events constants
vi.mock('@shared', () => ({
  EVENTS: {
    QA_ANSWER_POSTED: 'qa:answer_posted',
    QA_AI_SUGGESTION_READY: 'qa:ai_suggestion_ready',
    QA_QUESTION_RESOLVED: 'qa:question_resolved',
  },
}));

import { useQAStore } from '~/stores/qa.store';

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

describe('useQAWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return connection status from store', () => {
    vi.mocked(useQAStore).mockImplementation((selector: (state: QAStore) => unknown) => {
      const state: QAStore = {
        wsConnected: false,
        setWsConnected: vi.fn(),
        addNotification: vi.fn(),
        activeQuestionId: null,
        activeHighlight: null,
        inlinePopup: {
          isOpen: false,
          anchorRect: null,
          context: null,
        },
        pendingNotifications: [],
        // Missing QAActions
        openInlinePopup: vi.fn(),
        closeInlinePopup: vi.fn(),
        openHighlightTooltip: vi.fn(),
        closeHighlightTooltip: vi.fn(),
        setActiveQuestion: vi.fn(),
        clearActiveQuestion: vi.fn(),
        clearNotification: vi.fn(),
        clearAllNotifications: vi.fn(),
      };
      return selector(state);
    });

    const { result } = renderHook(
      () =>
        useQAWebSocket({
          onNewAnswer: vi.fn(),
          onAiSuggestionReady: vi.fn(),
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isConnected).toBe(false);
  });

  it('should accept callback options', () => {
    const onNewAnswer = vi.fn();
    const onAiSuggestionReady = vi.fn();
    const onQuestionResolved = vi.fn();

    const { result } = renderHook(
      () =>
        useQAWebSocket({
          onNewAnswer,
          onAiSuggestionReady,
          onQuestionResolved,
        }),
      { wrapper: createWrapper() }
    );

    // Hook should mount without errors
    expect(result.current).toBeDefined();
  });

  it('should work without callback options', () => {
    const { result } = renderHook(() => useQAWebSocket(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.isConnected).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(
      () =>
        useQAWebSocket({
          onNewAnswer: vi.fn(),
          onAiSuggestionReady: vi.fn(),
        }),
      { wrapper: createWrapper() }
    );

    // Should not throw on unmount
    expect(() => { unmount(); }).not.toThrow();
  });
});
