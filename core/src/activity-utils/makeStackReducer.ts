import type { Activity, Stack } from "../Stack";
import type { DomainEvent, InitializedEvent } from "../event-types";
import { uniqBy } from "../utils";
import { findTargetActivityIndices } from "./findTargetActivityIndices";
import { makeActivitiesReducer } from "./makeActivitiesReducer";
import { makeActivityReducer } from "./makeActivityReducer";

export function makeStackReducer(context: {
  now: number;
  initializedEvent: InitializedEvent;
}) {
  const activitiesReducer = makeActivitiesReducer({
    transitionDuration: context.initializedEvent.transitionDuration,
    now: context.now,
  });
  const activityReducer = makeActivityReducer({
    transitionDuration: context.initializedEvent.transitionDuration,
    now: context.now,
  });

  let _isPaused = false;

  return (stack: Stack, event: DomainEvent): Stack => {
    switch (event.name) {
      case "Initialized": {
        return {
          ...stack,
          transitionDuration: event.transitionDuration,
        };
      }
      case "ActivityRegistered": {
        return {
          ...stack,
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
        if (event.name === "Paused") {
          _isPaused = true;
        }
        if (event.name === "Resumed") {
          _isPaused = false;
        }

        const activities = activitiesReducer(stack.activities, event);
        const targetActivityIndices = findTargetActivityIndices(
          stack.activities,
          event,
          { transitionDuration: stack.transitionDuration, now: context.now },
        );

        for (const targetActivityIndex of targetActivityIndices) {
          activities[targetActivityIndex] = activityReducer(
            activities[targetActivityIndex],
            event,
          );
        }

        const isPaused = _isPaused;
        const isLoading = activities.find(
          (activity) =>
            activity.transitionState === "enter-active" ||
            activity.transitionState === "exit-active",
        );

        const globalTransitionState = isPaused
          ? "paused"
          : isLoading
            ? "loading"
            : "idle";

        return {
          ...stack,
          activities: uniqBy(activities, (activity) => activity.id),
          globalTransitionState,
        };
      }
    }
  };
}
