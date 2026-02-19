import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ModalType = "createCourse" | "createMaterial" | "createQuiz" | "settings" | null;

interface ToastData {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
}

interface UIState {
  activeModal: ModalType;
  isLoading: boolean;
  loadingMessage: string;
  toasts: ToastData[];
}

interface UIActions {
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  addToast: (toast: Omit<ToastData, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  activeModal: null,
  isLoading: false,
  loadingMessage: "",
  toasts: [],
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
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
