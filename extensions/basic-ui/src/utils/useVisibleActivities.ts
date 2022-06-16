import { useStack } from "@stackflow/react";
import { useMemo } from "react";

export function useVisibleActivities() {
  const stack = useStack();

  return useMemo(
    () =>
      stack.activities.filter(
        (activity) =>
          activity.transitionState === "enter-active" ||
          activity.transitionState === "enter-done" ||
          activity.transitionState === "exit-active",
      ),
    [stack.activities],
  );
}
