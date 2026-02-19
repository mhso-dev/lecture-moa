/**
 * Course Store Tests
 * REQ-FE-401: Grid and List View Toggle (persisted)
 * REQ-FE-402: Search Query State
 * REQ-FE-403: Category Filter State
 * REQ-FE-404: Sort Options State
 *
 * Note: localStorage is mocked in vitest.setup.ts for zustand persist middleware
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useCourseStore,
  useCourseViewMode,
  useCourseSearchQuery,
  useCourseSelectedCategory,
  useCourseSortOption,
} from '../../stores/course.store';
import type { CourseCategory, CourseSortOption } from '@shared';

describe('Course Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useCourseStore.setState({
      viewMode: 'grid',
      searchQuery: '',
      selectedCategory: null,
      sortOption: 'recent',
    });
    // Clear localStorage
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      const state = useCourseStore.getState();

      expect(state.viewMode).toBe('grid');
      expect(state.searchQuery).toBe('');
      expect(state.selectedCategory).toBeNull();
      expect(state.sortOption).toBe('recent');
    });
  });

  describe('setViewMode', () => {
    it('should update viewMode to grid', () => {
      const { setViewMode } = useCourseStore.getState();

      setViewMode('grid');

      expect(useCourseStore.getState().viewMode).toBe('grid');
    });

    it('should update viewMode to list', () => {
      const { setViewMode } = useCourseStore.getState();

      setViewMode('list');

      expect(useCourseStore.getState().viewMode).toBe('list');
    });

    it('should toggle between grid and list', () => {
      const { setViewMode } = useCourseStore.getState();

      setViewMode('list');
      expect(useCourseStore.getState().viewMode).toBe('list');

      setViewMode('grid');
      expect(useCourseStore.getState().viewMode).toBe('grid');
    });
  });

  describe('setSearchQuery', () => {
    it('should update searchQuery', () => {
      const { setSearchQuery } = useCourseStore.getState();

      setSearchQuery('typescript');

      expect(useCourseStore.getState().searchQuery).toBe('typescript');
    });

    it('should accept empty string', () => {
      const { setSearchQuery } = useCourseStore.getState();

      setSearchQuery('typescript');
      setSearchQuery('');

      expect(useCourseStore.getState().searchQuery).toBe('');
    });

    it('should handle special characters', () => {
      const { setSearchQuery } = useCourseStore.getState();

      setSearchQuery('react & next.js');

      expect(useCourseStore.getState().searchQuery).toBe('react & next.js');
    });

    it('should handle long search queries', () => {
      const { setSearchQuery } = useCourseStore.getState();
      const longQuery = 'a'.repeat(200);

      setSearchQuery(longQuery);

      expect(useCourseStore.getState().searchQuery).toBe(longQuery);
    });
  });

  describe('setSelectedCategory', () => {
    it('should update selectedCategory to a valid category', () => {
      const { setSelectedCategory } = useCourseStore.getState();

      setSelectedCategory('programming');

      expect(useCourseStore.getState().selectedCategory).toBe('programming');
    });

    it('should accept all valid categories', () => {
      const categories: CourseCategory[] = [
        'programming',
        'design',
        'business',
        'science',
        'language',
        'other',
      ];
      const { setSelectedCategory } = useCourseStore.getState();

      categories.forEach((category) => {
        setSelectedCategory(category);
        expect(useCourseStore.getState().selectedCategory).toBe(category);
      });
    });

    it('should clear category when set to null', () => {
      const { setSelectedCategory } = useCourseStore.getState();

      setSelectedCategory('programming');
      setSelectedCategory(null);

      expect(useCourseStore.getState().selectedCategory).toBeNull();
    });
  });

  describe('setSortOption', () => {
    it('should update sortOption to recent', () => {
      const { setSortOption } = useCourseStore.getState();

      setSortOption('recent');

      expect(useCourseStore.getState().sortOption).toBe('recent');
    });

    it('should update sortOption to popular', () => {
      const { setSortOption } = useCourseStore.getState();

      setSortOption('popular');

      expect(useCourseStore.getState().sortOption).toBe('popular');
    });

    it('should update sortOption to alphabetical', () => {
      const { setSortOption } = useCourseStore.getState();

      setSortOption('alphabetical');

      expect(useCourseStore.getState().sortOption).toBe('alphabetical');
    });

    it('should accept all valid sort options', () => {
      const sortOptions: CourseSortOption[] = ['recent', 'popular', 'alphabetical'];
      const { setSortOption } = useCourseStore.getState();

      sortOptions.forEach((option) => {
        setSortOption(option);
        expect(useCourseStore.getState().sortOption).toBe(option);
      });
    });
  });

  describe('Multiple State Updates', () => {
    it('should handle multiple sequential updates', () => {
      const { setViewMode, setSearchQuery, setSelectedCategory, setSortOption } =
        useCourseStore.getState();

      setViewMode('list');
      setSearchQuery('design');
      setSelectedCategory('design');
      setSortOption('popular');

      const state = useCourseStore.getState();
      expect(state.viewMode).toBe('list');
      expect(state.searchQuery).toBe('design');
      expect(state.selectedCategory).toBe('design');
      expect(state.sortOption).toBe('popular');
    });

    it('should maintain independence between state values', () => {
      const { setViewMode, setSearchQuery } = useCourseStore.getState();

      setViewMode('list');
      setSearchQuery('test');

      const state = useCourseStore.getState();
      expect(state.viewMode).toBe('list');
      expect(state.searchQuery).toBe('test');
      expect(state.selectedCategory).toBeNull(); // Should not change
      expect(state.sortOption).toBe('recent'); // Should not change
    });
  });

  describe('Store Type Safety', () => {
    it('should have correct type for viewMode', () => {
      const state = useCourseStore.getState();
      // Type assertion to ensure TypeScript recognizes the type
      const viewMode: 'grid' | 'list' = state.viewMode;
      expect(['grid', 'list']).toContain(viewMode);
    });

    it('should have correct type for sortOption', () => {
      const state = useCourseStore.getState();
      // Type assertion to ensure TypeScript recognizes the type
      const sortOption: CourseSortOption = state.sortOption;
      expect(['recent', 'popular', 'alphabetical']).toContain(sortOption);
    });
  });

  describe('Selector Hooks', () => {
    it('useCourseViewMode should return current viewMode', () => {
      const { result } = renderHook(() => useCourseViewMode());
      expect(result.current).toBe('grid');

      act(() => {
        useCourseStore.getState().setViewMode('list');
      });

      expect(result.current).toBe('list');
    });

    it('useCourseSearchQuery should return current searchQuery', () => {
      const { result } = renderHook(() => useCourseSearchQuery());
      expect(result.current).toBe('');

      act(() => {
        useCourseStore.getState().setSearchQuery('typescript');
      });

      expect(result.current).toBe('typescript');
    });

    it('useCourseSelectedCategory should return current selectedCategory', () => {
      const { result } = renderHook(() => useCourseSelectedCategory());
      expect(result.current).toBeNull();

      act(() => {
        useCourseStore.getState().setSelectedCategory('programming');
      });

      expect(result.current).toBe('programming');
    });

    it('useCourseSortOption should return current sortOption', () => {
      const { result } = renderHook(() => useCourseSortOption());
      expect(result.current).toBe('recent');

      act(() => {
        useCourseStore.getState().setSortOption('popular');
      });

      expect(result.current).toBe('popular');
    });
  });
});
