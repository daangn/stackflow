import type { Stack } from "../Stack";
import type { DomainEvent } from "../event-types";
import { uniqBy } from "../utils";
import { findTargetActivityIndices } from "./findTargetActivityIndices";
import { makeActivitiesReducer } from "./makeActivitiesReducer";
import { makeActivityReducer } from "./makeActivityReducer";

export function makeStackReducer(context: { now: number }) {
  return (stack: Stack, event: DomainEvent): Stack => {
    const isTransitionDone =
      context.now - event.eventDate >= stack.transitionDuration;

    const activitiesReducer = makeActivitiesReducer(isTransitionDone);

    const prevActivities = stack.activities;
    const nextActivities = uniqBy(
      activitiesReducer(prevActivities, event),
      (activity) => activity.id,
    );

    const targetActivityIndices = findTargetActivityIndices(
      prevActivities,
      event,
      {
        isTransitionDone,
      },
    );

    const activityReducer = makeActivityReducer({ isTransitionDone });

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
