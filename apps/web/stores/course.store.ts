/**
 * Course Store - UI State Management
 * REQ-FE-401: Grid and List View Toggle
 * REQ-FE-402: Search Query State
 * REQ-FE-403: Category Filter State
 * REQ-FE-404: Sort Options State
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { CourseCategory, CourseSortOption } from '@shared';

interface CourseUIState {
  viewMode: 'grid' | 'list';
  searchQuery: string;
  selectedCategory: CourseCategory | null;
  sortOption: CourseSortOption;
}

interface CourseUIActions {
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: CourseCategory | null) => void;
  setSortOption: (option: CourseSortOption) => void;
}

type CourseStore = CourseUIState & CourseUIActions;

const initialState: CourseUIState = {
  viewMode: 'grid',
  searchQuery: '',
  selectedCategory: null,
  sortOption: 'recent',
};

/**
 * Course Store - Manages course UI state
 *
 * State:
 * - viewMode: Current view layout (grid or list)
 * - searchQuery: Current search query string
 * - selectedCategory: Selected category filter or null
 * - sortOption: Current sort option
 *
 * Actions:
 * - setViewMode: Update view layout mode
 * - setSearchQuery: Update search query
 * - setSelectedCategory: Update category filter
 * - setSortOption: Update sort option
 *
 * Persistence:
 * - viewMode is persisted to localStorage for user preference
 * - Filter/sort state is synced with URL params for shareability
 */
export const useCourseStore = create<CourseStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setViewMode: (viewMode) =>
          set({ viewMode }, false, 'course/setViewMode'),

        setSearchQuery: (searchQuery) =>
          set({ searchQuery }, false, 'course/setSearchQuery'),

        setSelectedCategory: (selectedCategory) =>
          set({ selectedCategory }, false, 'course/setSelectedCategory'),

        setSortOption: (sortOption) =>
          set({ sortOption }, false, 'course/setSortOption'),
      }),
      {
        name: 'lecture-moa-course-ui',
        // Only persist viewMode preference, not filter state
        // Filter state is managed via URL params for shareability
        partialize: (state) => ({
          viewMode: state.viewMode,
        }),
        // Use custom storage to handle test environment
        storage: createJSONStorage(() => {
          // In test environment, return a no-op storage
          if (process.env.NODE_ENV === 'test') {
            return {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            };
          }
          return localStorage;
        }),
      }
    ),
    {
      name: 'CourseStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selector hooks for common patterns
export const useCourseViewMode = () => useCourseStore((state) => state.viewMode);
export const useCourseSearchQuery = () =>
  useCourseStore((state) => state.searchQuery);
export const useCourseSelectedCategory = () =>
  useCourseStore((state) => state.selectedCategory);
export const useCourseSortOption = () =>
  useCourseStore((state) => state.sortOption);
