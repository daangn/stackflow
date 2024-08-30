import type { ActivityStep } from "@stackflow/core";
import { type Accessor, useContext } from "solid-js";

import { ActivityContext } from "../__internal__/activity/ActivityProvider";

/**
 * Get current step
 */
export function useStep(): Accessor<ActivityStep | null> {
  const activity = useContext(ActivityContext);

  return () =>
    activity()
      ?.steps.filter((step) => step.id !== activity()?.id)
      .at(-1) ?? null;
}
