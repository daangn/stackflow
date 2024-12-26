import type { Stack } from "../Stack";
import type { DomainEvent } from "../event-types";
import { uniqBy } from "../utils";
import { findTargetActivityIndices } from "./findTargetActivityIndices";
import { makeActivitiesReducer } from "./makeActivitiesReducer";
import { makeActivityReducer } from "./makeActivityReducer";

export function makeStackReducer(context: {
  transitionDuration: number;
  now: number;
}) {
  const activitiesReducer = makeActivitiesReducer({
    transitionDuration: context.transitionDuration,
    now: context.now,
  });

  return (stack: Stack, event: DomainEvent): Stack => {
    const prevActivities = stack.activities;
    const nextActivities = uniqBy(
      activitiesReducer(prevActivities, event),
      (activity) => activity.id,
    );

    const targetActivityIndices = findTargetActivityIndices(
      prevActivities,
      event,
      {
        transitionDuration: stack.transitionDuration,
        now: context.now,
      },
    );

    const activityReducer = makeActivityReducer({
      transitionDuration: stack.transitionDuration,
      now: context.now,
    });

    targetActivityIndices.forEach((targetIdx) => {
      nextActivities[targetIdx] = activityReducer(
        nextActivities[targetIdx],
        event,
      );
    });

    const globalTransitionState = nextActivities.find(
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
          activities: nextActivities,
          transitionDuration: event.transitionDuration,
        };
      }
      case "ActivityRegistered": {
        return {
          ...stack,
          activities: nextActivities,
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
          activities: nextActivities,
          globalTransitionState,
        };
      }
    }
  };
}
