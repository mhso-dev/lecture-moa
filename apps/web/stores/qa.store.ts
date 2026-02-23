/**
 * Q&A Store - Manages Q&A feature state
 * REQ-FE-504: Zustand store for Q&A inline popup, navigation, and real-time updates
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  QAQuestionContext,
  QAWebSocketNotification,
} from "@shared";

/**
 * Extended context for inline popup including courseId
 * The base QAQuestionContext doesn't include courseId, but we need it for form submission
 */
export interface InlinePopupContext extends QAQuestionContext {
  courseId: string;
}

/**
 * Inline popup state for text selection Q&A trigger
 */
interface InlinePopupState {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  context: InlinePopupContext | null;
}

/**
 * Active highlight tooltip state for displaying Q&A questions on highlighted text
 * REQ-FE-009: Q&A Highlight Rendering
 */
interface ActiveHighlightState {
  highlightId: string;
  anchorRect: DOMRect;
  questionIds: string[];
}

/**
 * Q&A Store State
 */
interface QAState {
  // Inline popup state
  inlinePopup: InlinePopupState;

  // Highlight tooltip state (REQ-FE-009)
  activeHighlight: ActiveHighlightState | null;

  // Navigation state
  activeQuestionId: string | null;

  // Real-time state
  wsConnected: boolean;
  pendingNotifications: QAWebSocketNotification[];
}

/**
 * Q&A Store Actions
 */
interface QAActions {
  // Actions - Inline Popup
  openInlinePopup: (anchorRect: DOMRect, context: InlinePopupContext) => void;
  closeInlinePopup: () => void;

  // Actions - Highlight Tooltip (REQ-FE-009)
  openHighlightTooltip: (highlightId: string, anchorRect: DOMRect, questionIds: string[]) => void;
  closeHighlightTooltip: () => void;

  // Actions - Navigation
  setActiveQuestion: (id: string) => void;
  clearActiveQuestion: () => void;

  // Actions - Real-time
  setWsConnected: (connected: boolean) => void;
  addNotification: (notification: QAWebSocketNotification) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export type QAStore = QAState & QAActions;

/**
 * Initial state for Q&A store
 */
const initialState: QAState = {
  inlinePopup: {
    isOpen: false,
    anchorRect: null,
    context: null,
  },
  activeHighlight: null,
  activeQuestionId: null,
  wsConnected: false,
  pendingNotifications: [],
};

/**
 * Q&A Store - Manages Q&A feature state
 * REQ-FE-504: Zustand store for Q&A feature state
 *
 * State:
 * - inlinePopup: State for inline Q&A popup triggered by text selection
 *   - isOpen: Whether the popup is currently visible
 *   - anchorRect: Position data for popup positioning
 *   - context: Material context for question creation
 * - activeQuestionId: Currently active/viewing question for navigation
 * - wsConnected: WebSocket connection status for real-time updates
 * - pendingNotifications: Queue of unread Q&A notifications
 *
 * Actions:
 * - openInlinePopup: Show popup with selection context and position
 * - closeInlinePopup: Hide popup and clear selection state
 * - setActiveQuestion: Set the currently active question
 * - clearActiveQuestion: Clear the active question
 * - setWsConnected: Update WebSocket connection status
 * - addNotification: Add new notification to pending queue
 * - clearNotification: Remove specific notification from queue
 * - clearAllNotifications: Clear all pending notifications
 */
export const useQAStore = create<QAStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Actions - Inline Popup
      openInlinePopup: (anchorRect, context) => {
        set(
          { inlinePopup: { isOpen: true, anchorRect, context } },
          false,
          "qa/openInlinePopup"
        );
      },

      closeInlinePopup: () => {
        set(
          { inlinePopup: { isOpen: false, anchorRect: null, context: null } },
          false,
          "qa/closeInlinePopup"
        );
      },

      // Actions - Highlight Tooltip (REQ-FE-009)
      openHighlightTooltip: (highlightId, anchorRect, questionIds) => {
        set(
          { activeHighlight: { highlightId, anchorRect, questionIds } },
          false,
          "qa/openHighlightTooltip"
        );
      },

      closeHighlightTooltip: () => {
        set(
          { activeHighlight: null },
          false,
          "qa/closeHighlightTooltip"
        );
      },

      // Actions - Navigation
      setActiveQuestion: (id) => {
        set({ activeQuestionId: id }, false, "qa/setActiveQuestion");
      },

      clearActiveQuestion: () => {
        set({ activeQuestionId: null }, false, "qa/clearActiveQuestion");
      },

      // Actions - Real-time
      setWsConnected: (connected) => {
        set({ wsConnected: connected }, false, "qa/setWsConnected");
      },

      addNotification: (notification) => {
        set(
          (state) => ({
            pendingNotifications: [...state.pendingNotifications, notification],
          }),
          false,
          "qa/addNotification"
        );
      },

      clearNotification: (id) => {
        set(
          (state) => ({
            pendingNotifications: state.pendingNotifications.filter(
              (n) => n.id !== id
            ),
          }),
          false,
          "qa/clearNotification"
        );
      },

      clearAllNotifications: () => {
        set({ pendingNotifications: [] }, false, "qa/clearAllNotifications");
      },
    }),
    {
      name: "QAStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Selector hooks for common patterns
export const useInlinePopup = () => useQAStore((state) => state.inlinePopup);
export const useActiveHighlight = () =>
  useQAStore((state) => state.activeHighlight);
export const useActiveQuestionId = () =>
  useQAStore((state) => state.activeQuestionId);
export const useWsConnected = () => useQAStore((state) => state.wsConnected);
export const usePendingNotifications = () =>
  useQAStore((state) => state.pendingNotifications);
