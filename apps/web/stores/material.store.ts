import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type FontSize = "sm" | "md" | "lg";

interface MaterialState {
  activeHeadingId: string | null;
  isTocOpen: boolean;
  fontSize: FontSize;
  isFullscreen: boolean;
  selectedText: string | null;
  selectionAnchorRect: DOMRect | null;
}

interface MaterialActions {
  setActiveHeading: (id: string | null) => void;
  toggleToc: () => void;
  setTocOpen: (open: boolean) => void;
  setFontSize: (size: FontSize) => void;
  toggleFullscreen: () => void;
  setSelection: (text: string, rect: DOMRect) => void;
  clearSelection: () => void;
}

type MaterialStore = MaterialState & MaterialActions;

const initialState: MaterialState = {
  activeHeadingId: null,
  isTocOpen: false,
  fontSize: "md",
  isFullscreen: false,
  selectedText: null,
  selectionAnchorRect: null,
};

/**
 * Material Store - Manages material viewer UI state
 * REQ-FE-321: Zustand store for material viewer state
 *
 * State:
 * - activeHeadingId: Currently visible section (scroll spy)
 * - isTocOpen: ToC panel visibility (tablet/mobile)
 * - fontSize: User reading preference (persisted)
 * - isFullscreen: Fullscreen reading mode
 * - selectedText: Current text selection for Q&A trigger
 * - selectionAnchorRect: Position data for Q&A popup
 *
 * Actions:
 * - setActiveHeading: Update active heading from scroll spy
 * - toggleToc: Toggle ToC panel visibility
 * - setTocOpen: Set ToC panel to specific state
 * - setFontSize: Change font size preference
 * - toggleFullscreen: Toggle fullscreen mode
 * - setSelection: Store text selection and position
 * - clearSelection: Clear text selection state
 *
 * Persistence:
 * - fontSize is persisted to localStorage
 */
export const useMaterialStore = create<MaterialStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setActiveHeading: (id) =>
          set({ activeHeadingId: id }, false, "material/setActiveHeading"),

        toggleToc: () =>
          set(
            (state) => ({ isTocOpen: !state.isTocOpen }),
            false,
            "material/toggleToc"
          ),

        setTocOpen: (open) =>
          set({ isTocOpen: open }, false, "material/setTocOpen"),

        setFontSize: (fontSize) =>
          set({ fontSize }, false, "material/setFontSize"),

        toggleFullscreen: () =>
          set(
            (state) => ({ isFullscreen: !state.isFullscreen }),
            false,
            "material/toggleFullscreen"
          ),

        setSelection: (selectedText, selectionAnchorRect) =>
          set(
            { selectedText, selectionAnchorRect },
            false,
            "material/setSelection"
          ),

        clearSelection: () =>
          set(
            { selectedText: null, selectionAnchorRect: null },
            false,
            "material/clearSelection"
          ),
      }),
      {
        name: "lecture-moa-material",
        partialize: (state) => ({
          fontSize: state.fontSize,
        }),
      }
    ),
    {
      name: "MaterialStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Selector hooks for common patterns
export const useActiveHeading = () =>
  useMaterialStore((state) => state.activeHeadingId);
export const useIsTocOpen = () => useMaterialStore((state) => state.isTocOpen);
export const useFontSize = () => useMaterialStore((state) => state.fontSize);
export const useIsFullscreen = () =>
  useMaterialStore((state) => state.isFullscreen);
export const useTextSelection = () =>
  useMaterialStore((state) => ({
    selectedText: state.selectedText,
    selectionAnchorRect: state.selectionAnchorRect,
  }));
