import { useStack } from "@stackflow/react";
import { useMemo } from "react";

export function useActiveActivities() {
  const stack = useStack();

  return useMemo(
    () =>
      stack.activities.filter(
        (activity) =>
          activity.transitionState === "enter-active" ||
          activity.transitionState === "enter-done",
      ),
    [stack.activities],
  );
}
