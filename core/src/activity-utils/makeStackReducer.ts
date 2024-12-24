import type { Stack } from "../Stack";
import type { DomainEvent } from "../event-types";
import { uniqBy } from "../utils";
import { findTargetActivityIndices } from "./findTargetActivityIndices";
import { makeActivitiesReducer } from "./makeActivitiesReducer";
import { makeActivityReducer } from "./makeActivityReducer";

export function makeStackReducer(now: number) {
  return (stack: Stack, event: DomainEvent): Stack => {
    const isTransitionDone = now - event.eventDate >= stack.transitionDuration;

    const globalTransitionState: Stack["globalTransitionState"] =
      stack.globalTransitionState === "loading" || !isTransitionDone
        ? "loading"
        : "idle";

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
      case "Paused": {
        return {
          ...stack,
          activities,
        };
      }
      case "Resumed": {
        return {
          ...stack,
          activities,
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
