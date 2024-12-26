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

        const globalTransitionState = _isPaused
          ? "paused"
          : nextActivities.find(
                (activity) =>
                  activity.transitionState === "enter-active" ||
                  activity.transitionState === "exit-active",
              )
            ? "loading"
            : "idle";

        return {
          ...stack,
          activities: nextActivities,
          globalTransitionState,
        };
      }
    }
  };
}
