import type { ActivityStep } from "@stackflow/core";
import { useContext } from "react";

import { ActivityContext } from "./activity/ActivityProvider";

/**
 * Get current step
 */
export function useStep(): ActivityStep | null {
  const { steps, id } = useContext(ActivityContext);

  return steps.filter((step) => step.id !== id).at(-1) ?? null;
}
