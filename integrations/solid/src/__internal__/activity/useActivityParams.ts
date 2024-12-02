import type { Accessor } from "solid-js";
import { createMemo, useContext } from "solid-js";

import { ActivityContext } from "./ActivityProvider";

/**
 * Get current activity parameters
 */
export function useActivityParams<
  T extends { [key in keyof T]: string | undefined },
>(): Accessor<T | undefined> {
  const activity = useContext(ActivityContext);
  return createMemo(() => activity()?.params as T | undefined);
}
