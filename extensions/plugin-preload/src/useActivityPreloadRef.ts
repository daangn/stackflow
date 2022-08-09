import { useActivity } from "@stackflow/react";

/**
 * Get current activity preload reference
 */
export function useActivityPreloadRef<T>(): T {
  const { activityContext } = useActivity();
  return (activityContext as any)?.preloadRef;
}
