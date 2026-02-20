/**
 * Q&A Store Tests
 * REQ-FE-504: Zustand store for Q&A feature state
 *
 * Test Coverage:
 * - Initial state verification
 * - Inline popup management
 * - Active question navigation
 * - WebSocket connection state
 * - Notification management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useQAStore,
  useInlinePopup,
  useActiveQuestionId,
  useWsConnected,
  usePendingNotifications,
  type InlinePopupContext,
} from '../../stores/qa.store';
import type { QAWebSocketNotification } from '@shared';

// Helper to create mock DOMRect
const createMockDOMRect = (): DOMRect => ({
  x: 100,
  y: 200,
  width: 300,
  height: 50,
  top: 200,
  bottom: 250,
  left: 100,
  right: 400,
  toJSON: () => '',
});

// Helper to create mock context
const createMockContext = (): InlinePopupContext => ({
  courseId: 'course-123',
  materialId: 'material-123',
  headingId: 'heading-456',
  selectedText: 'This is selected text for testing',
});

// Helper to create mock notification
const createMockNotification = (id: string): QAWebSocketNotification => ({
  id,
  type: 'NEW_ANSWER',
  questionId: 'question-123',
  questionTitle: 'Test Question',
  actorName: 'Test User',
  receivedAt: '2026-02-19T10:00:00Z',
});

describe('QA Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useQAStore.setState({
      inlinePopup: {
        isOpen: false,
        anchorRect: null,
        context: null,
      },
      activeQuestionId: null,
      wsConnected: false,
      pendingNotifications: [],
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      const state = useQAStore.getState();

      expect(state.inlinePopup.isOpen).toBe(false);
      expect(state.inlinePopup.anchorRect).toBeNull();
      expect(state.inlinePopup.context).toBeNull();
      expect(state.activeQuestionId).toBeNull();
      expect(state.wsConnected).toBe(false);
      expect(state.pendingNotifications).toEqual([]);
    });
  });

  describe('openInlinePopup', () => {
    it('should set inline popup state correctly', () => {
      const { openInlinePopup } = useQAStore.getState();
      const mockRect = createMockDOMRect();
      const mockContext = createMockContext();

      openInlinePopup(mockRect, mockContext);

      const state = useQAStore.getState();
      expect(state.inlinePopup.isOpen).toBe(true);
      expect(state.inlinePopup.anchorRect).toBe(mockRect);
      expect(state.inlinePopup.context).toBe(mockContext);
    });

    it('should replace existing popup state', () => {
      const { openInlinePopup } = useQAStore.getState();
      const firstRect = createMockDOMRect();
      const firstContext = createMockContext();

      openInlinePopup(firstRect, firstContext);
      expect(useQAStore.getState().inlinePopup.isOpen).toBe(true);

      const secondRect = createMockDOMRect();
      const secondContext: InlinePopupContext = {
        courseId: 'course-456',
        materialId: 'material-789',
        headingId: 'heading-012',
        selectedText: 'Different selected text',
      };

      openInlinePopup(secondRect, secondContext);

      const state = useQAStore.getState();
      expect(state.inlinePopup.context?.materialId).toBe('material-789');
      expect(state.inlinePopup.context?.selectedText).toBe('Different selected text');
    });
  });

  describe('closeInlinePopup', () => {
    it('should reset inline popup state', () => {
      const { openInlinePopup, closeInlinePopup } = useQAStore.getState();
      const mockRect = createMockDOMRect();
      const mockContext = createMockContext();

      openInlinePopup(mockRect, mockContext);
      expect(useQAStore.getState().inlinePopup.isOpen).toBe(true);

      closeInlinePopup();

      const state = useQAStore.getState();
      expect(state.inlinePopup.isOpen).toBe(false);
      expect(state.inlinePopup.anchorRect).toBeNull();
      expect(state.inlinePopup.context).toBeNull();
    });

    it('should be safe to call when popup is already closed', () => {
      const { closeInlinePopup } = useQAStore.getState();

      // Should not throw when called on already closed popup
      expect(() => { closeInlinePopup(); }).not.toThrow();
      expect(useQAStore.getState().inlinePopup.isOpen).toBe(false);
    });
  });

  describe('setActiveQuestion', () => {
    it('should set active question id', () => {
      const { setActiveQuestion } = useQAStore.getState();

      setActiveQuestion('question-123');

      expect(useQAStore.getState().activeQuestionId).toBe('question-123');
    });

    it('should update active question id', () => {
      const { setActiveQuestion } = useQAStore.getState();

      setActiveQuestion('question-123');
      expect(useQAStore.getState().activeQuestionId).toBe('question-123');

      setActiveQuestion('question-456');
      expect(useQAStore.getState().activeQuestionId).toBe('question-456');
    });
  });

  describe('clearActiveQuestion', () => {
    it('should clear active question id', () => {
      const { setActiveQuestion, clearActiveQuestion } = useQAStore.getState();

      setActiveQuestion('question-123');
      expect(useQAStore.getState().activeQuestionId).toBe('question-123');

      clearActiveQuestion();

      expect(useQAStore.getState().activeQuestionId).toBeNull();
    });

    it('should be safe to call when no active question', () => {
      const { clearActiveQuestion } = useQAStore.getState();

      expect(() => { clearActiveQuestion(); }).not.toThrow();
      expect(useQAStore.getState().activeQuestionId).toBeNull();
    });
  });

  describe('setWsConnected', () => {
    it('should set wsConnected to true', () => {
      const { setWsConnected } = useQAStore.getState();

      setWsConnected(true);

      expect(useQAStore.getState().wsConnected).toBe(true);
    });

    it('should set wsConnected to false', () => {
      const { setWsConnected } = useQAStore.getState();

      setWsConnected(true);
      expect(useQAStore.getState().wsConnected).toBe(true);

      setWsConnected(false);
      expect(useQAStore.getState().wsConnected).toBe(false);
    });

    it('should handle rapid connection state changes', () => {
      const { setWsConnected } = useQAStore.getState();

      setWsConnected(true);
      setWsConnected(false);
      setWsConnected(true);
      setWsConnected(false);

      expect(useQAStore.getState().wsConnected).toBe(false);
    });
  });

  describe('addNotification', () => {
    it('should add notification to array', () => {
      const { addNotification } = useQAStore.getState();
      const notification = createMockNotification('notif-1');

      addNotification(notification);

      const state = useQAStore.getState();
      expect(state.pendingNotifications).toHaveLength(1);
      expect(state.pendingNotifications[0]).toEqual(notification);
    });

    it('should add multiple notifications', () => {
      const { addNotification } = useQAStore.getState();

      addNotification(createMockNotification('notif-1'));
      addNotification(createMockNotification('notif-2'));
      addNotification(createMockNotification('notif-3'));

      const state = useQAStore.getState();
      expect(state.pendingNotifications).toHaveLength(3);
      expect(state.pendingNotifications.map((n) => n.id)).toEqual([
        'notif-1',
        'notif-2',
        'notif-3',
      ]);
    });

    it('should handle different notification types', () => {
      const { addNotification } = useQAStore.getState();

      const newAnswer: QAWebSocketNotification = {
        id: 'notif-1',
        type: 'NEW_ANSWER',
        questionId: 'q-1',
        questionTitle: 'Q1',
        receivedAt: '2026-02-19T10:00:00Z',
      };

      const aiSuggestion: QAWebSocketNotification = {
        id: 'notif-2',
        type: 'AI_SUGGESTION_READY',
        questionId: 'q-2',
        questionTitle: 'Q2',
        receivedAt: '2026-02-19T10:01:00Z',
      };

      const resolved: QAWebSocketNotification = {
        id: 'notif-3',
        type: 'QUESTION_RESOLVED',
        questionId: 'q-3',
        questionTitle: 'Q3',
        receivedAt: '2026-02-19T10:02:00Z',
      };

      addNotification(newAnswer);
      addNotification(aiSuggestion);
      addNotification(resolved);

      const state = useQAStore.getState();
      expect(state.pendingNotifications).toHaveLength(3);
      expect(state.pendingNotifications[0]?.type).toBe('NEW_ANSWER');
      expect(state.pendingNotifications[1]?.type).toBe('AI_SUGGESTION_READY');
      expect(state.pendingNotifications[2]?.type).toBe('QUESTION_RESOLVED');
    });
  });

  describe('clearNotification', () => {
    it('should remove specific notification by id', () => {
      const { addNotification, clearNotification } = useQAStore.getState();

      addNotification(createMockNotification('notif-1'));
      addNotification(createMockNotification('notif-2'));
      addNotification(createMockNotification('notif-3'));

      expect(useQAStore.getState().pendingNotifications).toHaveLength(3);

      clearNotification('notif-2');

      const state = useQAStore.getState();
      expect(state.pendingNotifications).toHaveLength(2);
      expect(state.pendingNotifications.map((n) => n.id)).toEqual([
        'notif-1',
        'notif-3',
      ]);
    });

    it('should handle removing non-existent notification', () => {
      const { addNotification, clearNotification } = useQAStore.getState();

      addNotification(createMockNotification('notif-1'));

      // Should not throw and should not modify existing notifications
      expect(() => { clearNotification('non-existent'); }).not.toThrow();
      expect(useQAStore.getState().pendingNotifications).toHaveLength(1);
    });

    it('should handle clearing from empty array', () => {
      const { clearNotification } = useQAStore.getState();

      expect(() => { clearNotification('any-id'); }).not.toThrow();
      expect(useQAStore.getState().pendingNotifications).toHaveLength(0);
    });
  });

  describe('clearAllNotifications', () => {
    it('should empty notifications array', () => {
      const { addNotification, clearAllNotifications } = useQAStore.getState();

      addNotification(createMockNotification('notif-1'));
      addNotification(createMockNotification('notif-2'));
      addNotification(createMockNotification('notif-3'));

      expect(useQAStore.getState().pendingNotifications).toHaveLength(3);

      clearAllNotifications();

      expect(useQAStore.getState().pendingNotifications).toHaveLength(0);
      expect(useQAStore.getState().pendingNotifications).toEqual([]);
    });

    it('should be safe to call on empty array', () => {
      const { clearAllNotifications } = useQAStore.getState();

      expect(() => { clearAllNotifications(); }).not.toThrow();
      expect(useQAStore.getState().pendingNotifications).toEqual([]);
    });
  });

  describe('Multiple State Updates', () => {
    it('should handle multiple sequential updates independently', () => {
      const {
        openInlinePopup,
        setActiveQuestion,
        setWsConnected,
        addNotification,
      } = useQAStore.getState();

      const mockRect = createMockDOMRect();
      const mockContext = createMockContext();

      openInlinePopup(mockRect, mockContext);
      setActiveQuestion('question-789');
      setWsConnected(true);
      addNotification(createMockNotification('notif-1'));

      const state = useQAStore.getState();
      expect(state.inlinePopup.isOpen).toBe(true);
      expect(state.activeQuestionId).toBe('question-789');
      expect(state.wsConnected).toBe(true);
      expect(state.pendingNotifications).toHaveLength(1);
    });
  });

  describe('Selector Hooks', () => {
    it('useInlinePopup should return current inline popup state', () => {
      const { result } = renderHook(() => useInlinePopup());
      expect(result.current.isOpen).toBe(false);

      act(() => {
        useQAStore.getState().openInlinePopup(createMockDOMRect(), createMockContext());
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('useActiveQuestionId should return current active question id', () => {
      const { result } = renderHook(() => useActiveQuestionId());
      expect(result.current).toBeNull();

      act(() => {
        useQAStore.getState().setActiveQuestion('question-123');
      });

      expect(result.current).toBe('question-123');
    });

    it('useWsConnected should return current ws connected state', () => {
      const { result } = renderHook(() => useWsConnected());
      expect(result.current).toBe(false);

      act(() => {
        useQAStore.getState().setWsConnected(true);
      });

      expect(result.current).toBe(true);
    });

    it('usePendingNotifications should return current notifications', () => {
      const { result } = renderHook(() => usePendingNotifications());
      expect(result.current).toEqual([]);

      act(() => {
        useQAStore.getState().addNotification(createMockNotification('notif-1'));
      });

      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.id).toBe('notif-1');
    });
  });

  describe('Store Type Safety', () => {
    it('should have correct type for inlinePopup', () => {
      const state = useQAStore.getState();
      expect(typeof state.inlinePopup.isOpen).toBe('boolean');
      expect(state.inlinePopup.anchorRect === null || state.inlinePopup.anchorRect instanceof DOMRect || typeof state.inlinePopup.anchorRect === 'object').toBe(true);
    });

    it('should have correct type for wsConnected', () => {
      const state = useQAStore.getState();
      expect(typeof state.wsConnected).toBe('boolean');
    });

    it('should have correct type for pendingNotifications', () => {
      const state = useQAStore.getState();
      expect(Array.isArray(state.pendingNotifications)).toBe(true);
    });
  });
});
