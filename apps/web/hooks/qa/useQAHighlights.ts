/**
 * useQAHighlights Hook - Q&A Highlight Data Query
 * REQ-FE-009: TanStack Query hook for fetching highlight data per material
 *
 * Provides highlight data needed by the rehype-qa-highlights plugin
 * to render <mark> elements in the markdown content.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getHighlightsForMaterial } from "~/lib/supabase/qa";
import { qaKeys } from "./qa-keys";
import type { QAHighlightData } from "@shared";

/**
 * Hook for fetching Q&A highlight data for a specific material.
 *
 * Returns an array of QAHighlightData used by the rehype-qa-highlights
 * plugin to inject <mark> elements into the markdown HAST tree.
 *
 * @param materialId - The material ID to fetch highlights for
 * @returns UseQueryResult with highlight data array
 *
 * @example
 * ```tsx
 * const { data: highlights = [] } = useQAHighlights(materialId);
 *
 * <MarkdownRenderer content={content} highlights={highlights} />
 * ```
 */
export function useQAHighlights(
  materialId: string
): UseQueryResult<QAHighlightData[]> {
  return useQuery({
    queryKey: qaKeys.highlights(materialId),
    queryFn: () => getHighlightsForMaterial(materialId),
    enabled: !!materialId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
