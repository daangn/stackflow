import { ActivityParams } from "@stackflow/core";
import { useContext } from "react";

import { ActivityContext } from "./ActivityContext";

/**
 * Get current activity parameters
 */
export function useActivityParams<
  T extends ActivityParams<T> = ActivityParams,
>(): T {
  return useContext(ActivityContext).params as any;
}
