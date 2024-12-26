import type { Stack } from "../Stack";
import type { DomainEvent } from "../event-types";
import { uniqBy } from "../utils";
import { findTargetActivityIndices } from "./findTargetActivityIndices";
import { makeActivitiesReducer } from "./makeActivitiesReducer";
import { makeActivityReducer } from "./makeActivityReducer";

export function makeStackReducer(now: number) {
  return (stack: Stack, event: DomainEvent): Stack => {
    const isTransitionDone = now - event.eventDate >= stack.transitionDuration;

    const activitiesReducer = makeActivitiesReducer(isTransitionDone);
    const activities = uniqBy(
      activitiesReducer(stack.activities, event),
      (activity) => activity.id,
    );

    const targetActivityIndices = findTargetActivityIndices({
      activities,
      event,
      isTransitionDone,
    });
    const activityReducer = makeActivityReducer(isTransitionDone);

    targetActivityIndices.forEach((targetIdx) => {
      activities[targetIdx] = activityReducer(activities[targetIdx], event);
    });

    const globalTransitionState = activities.find(
      (activity) =>
        activity.transitionState === "enter-active" ||
        activity.transitionState === "exit-active",
    )
      ? "loading"
      : "idle";

    switch (event.name) {
      case "Initialized": {
        return {
          ...stack,
          activities,
          transitionDuration: event.transitionDuration,
        };
      }
      case "ActivityRegistered": {
        return {
          ...stack,
          activities,
          registeredActivities: [
            ...stack.registeredActivities,
            {
              name: event.activityName,
              ...(event.activityParamsSchema
                ? {
                    paramsSchema: event.activityParamsSchema,
                  }
                : null),
            },
          ],
        };
      }
      default: {
        return {
          ...stack,
          activities,
          globalTransitionState,
        };
      }
    }
  };
}
