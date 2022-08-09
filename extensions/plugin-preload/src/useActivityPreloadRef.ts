import { useActivity } from "@stackflow/react";

/**
 * Get current activity preload reference
 */
export function useActivityPreloadRef<T>(): T {
  const { eventContext } = useActivity();
  return (eventContext as any).preloadRef;
}
