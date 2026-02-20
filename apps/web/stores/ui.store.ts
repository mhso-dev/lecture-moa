import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ModalType = "createCourse" | "createMaterial" | "createQuiz" | "settings" | null;

interface ToastData {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
}

/**
 * Team WebSocket connection status
 * REQ-FE-782: Track team memo real-time connection state
 */
export type TeamSocketStatus = "connected" | "disconnected" | "connecting" | "error";

interface UIState {
  activeModal: ModalType;
  isLoading: boolean;
  loadingMessage: string;
  toasts: ToastData[];
  teamSocketStatus: TeamSocketStatus;
}

interface UIActions {
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  addToast: (toast: Omit<ToastData, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setTeamSocketStatus: (status: TeamSocketStatus) => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  activeModal: null,
  isLoading: false,
  loadingMessage: "",
  toasts: [],
  teamSocketStatus: "disconnected",
};

/**
 * UI Store - Manages global UI state
 *
 * State:
 * - activeModal: Currently open modal identifier
 * - isLoading: Global loading state
 * - loadingMessage: Optional loading message
 * - toasts: Array of active toast notifications
 *
 * Actions:
 * - openModal: Open a specific modal
 * - closeModal: Close current modal
 * - setLoading: Set global loading state with optional message
 * - addToast: Add new toast notification
 * - removeToast: Remove toast by ID
 * - clearToasts: Clear all toasts
 * - setTeamSocketStatus: Update team WebSocket connection status
 *
 * Note: Toast UI is handled by Sonner, this store is for programmatic control
 */
export const useUIStore = create<UIStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      openModal: (modal) =>
        { set({ activeModal: modal }, false, "ui/openModal"); },

      closeModal: () =>
        { set({ activeModal: null }, false, "ui/closeModal"); },

      setLoading: (isLoading, message = "") =>
        { set(
          { isLoading, loadingMessage: message },
          false,
          "ui/setLoading"
        ); },

      addToast: (toast) => {
        const id = `toast-${String(Date.now())}-${Math.random().toString(36).slice(2, 9)}`;
        set(
          { toasts: [...get().toasts, { ...toast, id }] },
          false,
          "ui/addToast"
        );
        return id;
      },

      removeToast: (id) =>
        { set(
          { toasts: get().toasts.filter((t) => t.id !== id) },
          false,
          "ui/removeToast"
        ); },

      clearToasts: () =>
        { set({ toasts: [] }, false, "ui/clearToasts"); },

      setTeamSocketStatus: (status) =>
        { set({ teamSocketStatus: status }, false, "ui/setTeamSocketStatus"); },
    }),
    {
      name: "UIStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Selector hooks for common patterns
export const useActiveModal = () => useUIStore((state) => state.activeModal);
export const useIsLoading = () => useUIStore((state) => state.isLoading);
export const useLoadingMessage = () => useUIStore((state) => state.loadingMessage);
export const useTeamSocketStatus = () => useUIStore((state) => state.teamSocketStatus);
