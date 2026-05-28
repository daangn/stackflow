import { useContext } from "react";

import { ActivityContext } from "./ActivityProvider";

/**
 * Get current activity parameters
 */
export function useActivityParams<
  T extends { [key in keyof T]: string | undefined },
>(): T {
  return useContext(ActivityContext).params as T;
}
