"use client";

import { useEffect, useCallback } from "react";

/**
 * useBeforeUnload Hook
 * REQ-FE-348, REQ-FE-358: Navigation guard for unsaved changes
 *
 * Prompts the user before navigating away when there are unsaved changes.
 * Works with browser close/refresh.
 *
 * Note: For Next.js App Router navigation, you may need to implement
 * additional handling with router events or use blocked navigation patterns.
 *
 * @param shouldWarn - Whether to show the warning prompt
 *
 * @example
 * ```tsx
 * const [isDirty, setIsDirty] = useState(false);
 * useBeforeUnload(isDirty);
 *
 * // When form changes
 * const handleChange = () => setIsDirty(true);
 *
 * // After successful save
 * const handleSave = async () => {
 *   await saveForm();
 *   setIsDirty(false);
 * };
 * ```
 */
export function useBeforeUnload(shouldWarn: boolean): void {
  // Handle browser close/refresh
  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (shouldWarn) {
        // Standard way to trigger the browser's native confirmation dialog
        event.preventDefault();
        // Chrome requires returnValue to be set
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        event.returnValue = "";
        return "";
      }
    },
    [shouldWarn]
  );

  useEffect(() => {
    if (shouldWarn) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldWarn, handleBeforeUnload]);
}
