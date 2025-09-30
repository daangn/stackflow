import { ActivityActivationCountsContext } from "ActivityActivationCountsContext";
import { useActivity } from "@stackflow/react";
import { useContext } from "react";

export function useIsRenderInTransition() {
  const { id } = useActivity();
  const activityActivationCounts = useContext(ActivityActivationCountsContext);
  const activityActivationCount = activityActivationCounts.find(
    (activityActivationCount) => activityActivationCount.activityId === id,
  )?.activationCount;

  return activityActivationCount !== undefined && activityActivationCount === 0;
}
