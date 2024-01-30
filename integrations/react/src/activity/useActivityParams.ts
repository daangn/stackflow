import { useContext } from "react";

import { ActivityContext } from "./ActivityProvider";

/**
 * Get current activity parameters
 */
export function useActivityParams<
  T extends Record<keyof T, string | undefined>,
>(): T {
  return useContext(ActivityContext).params as T;
}
