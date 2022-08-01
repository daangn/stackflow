import { useContext } from "react";

import { ActivityContext } from "./ActivityContext";

/**
 * Get current activity preload reference
 */
export function useActivityPreloadRef<T>(): T {
  return useContext(ActivityContext).preloadRef as T;
}
