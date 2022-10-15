import type { ActivityTransitionState } from "@stackflow/core";
import { useStack } from "@stackflow/react";
import { useMemo } from "react";

export function useActivitiesFilter({ or }: { or: ActivityTransitionState[] }) {
  const stack = useStack();

  return useMemo(
    () =>
      stack.activities.filter(
        (activity) => or.indexOf(activity.transitionState) > -1,
      ),
    [stack.activities],
  );
}
