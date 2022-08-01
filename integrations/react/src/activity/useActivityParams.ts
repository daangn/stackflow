import { useContext } from "react";

import { ActivityContext } from "./ActivityContext";

/**
 * Get current activity parameters
 */
export function useActivityParams<
  T extends { [key in keyof T]: string | undefined },
>(): T {
  return useContext(ActivityContext).params as any;
}
