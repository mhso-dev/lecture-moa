/**
 * Query Key Factory for Q&A
 * REQ-FE-503: Centralized query key management for TanStack Query
 *
 * Follows the recommended query key structure pattern:
 * - All keys are arrays for consistency
 * - Hierarchy: ['qa'] -> ['qa', 'list'] -> ['qa', 'list', filter]
 * - Factory functions return readonly tuples for type safety
 */

import type { QAListFilter } from '@shared';

/**
 * Query key factory for Q&A queries
 */
export const qaKeys = {
  /** All Q&A query keys */
  all: ['qa'] as const,

  /** All Q&A list queries */
  lists: () => [...qaKeys.all, 'list'] as const,

  /** Specific Q&A list query with filter */
  list: (filter: Omit<QAListFilter, 'page'>) =>
    [...qaKeys.lists(), filter] as const,

  /** All Q&A detail queries */
  details: () => [...qaKeys.all, 'detail'] as const,

  /** Specific Q&A detail query by ID */
  detail: (questionId: string) =>
    [...qaKeys.details(), questionId] as const,
};
