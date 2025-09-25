import { ActivityActivationCountsContext } from "ActivityActivationCountsContext";
import { useActivity } from "@stackflow/react";
import { useContext } from "react";
import { use } from "react18-use";

export function useDelayTransitionRender() {
  const { id } = useActivity();
  const activityActivationCounts = useContext(ActivityActivationCountsContext);
  const activityActivationCount = activityActivationCounts.find(
    (activityActivationCount) => activityActivationCount.activityId === id,
  )?.activationCount;

  if (activityActivationCount === undefined || activityActivationCount >= 1)
    return;

  return use(suspenseSentinel);
}

const suspenseSentinel = new Promise(() => {});
