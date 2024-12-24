import type { Activity, Stack } from "./Stack";
import { findTargetActivityIndices } from "./activity-utils/findTargetActivityIndices";
import { makeActivitiesReducer } from "./activity-utils/makeActivitiesReducer";
import { makeActivityReducer } from "./activity-utils/makeActivityReducer";
import { makeStackReducer } from "./activity-utils/makeStackReducer";
import type { DomainEvent } from "./event-types";
import { filterEvents, validateEvents } from "./event-utils";
import { compareBy, uniqBy } from "./utils";

export function aggregate(inputEvents: DomainEvent[], now: number): Stack {
  /**
   * 1. Pre-process
   */
  const events = uniqBy(
    [...inputEvents].sort((a, b) => compareBy(a, b, (e) => e.id)),
    (e) => e.id,
  );

  /**
   * 2. Validate events
   */
  validateEvents(events);

  /**
   * 3. Run reducer
   */
  const baseStack: Stack = {
    activities: [],
    globalTransitionState: "idle",
    registeredActivities: [],
    transitionDuration: 0,
  };
  const stackReducer = makeStackReducer(now);
  const stack = events.reduce(stackReducer, baseStack);

  const activities = events.reduce(
    (activities: Activity[], event: DomainEvent) => {
      const isTransitionDone =
        now - event.eventDate >= stack.transitionDuration;

      const targets = findTargetActivityIndices({
        activities,
        event,
        isTransitionDone,
      });

      const activityReducer = makeActivityReducer(isTransitionDone);

      const activitiesReducer = makeActivitiesReducer(isTransitionDone);

      const newActivities = activitiesReducer(activities, event);

      targets.forEach((targetIdx) => {
        newActivities[targetIdx] = activityReducer(
          newActivities[targetIdx],
          event,
        );
      });

      return newActivities;
    },
    [],
  );

  const uniqActivities = uniqBy(activities, (activity) => activity.id);

  /**
   * 4. Post-process
   */
  const visibleActivities = uniqActivities.filter(
    (activity) =>
      activity.transitionState === "enter-active" ||
      activity.transitionState === "enter-done" ||
      activity.transitionState === "exit-active",
  );
  const enteredActivities = visibleActivities.filter(
    (activity) =>
      activity.transitionState === "enter-active" ||
      activity.transitionState === "enter-done",
  );

  const lastVisibleActivity = visibleActivities[visibleActivities.length - 1];
  const lastEnteredActivity = enteredActivities[enteredActivities.length - 1];

  const output: Stack = {
    ...stack,
    activities: uniqActivities
      .map((activity) => {
        const zIndex = visibleActivities.findIndex(
          ({ id }) => id === activity.id,
        );

        return {
          id: activity.id,
          name: activity.name,
          transitionState: activity.transitionState,
          params: activity.params,
          steps: activity.steps,
          enteredBy: activity.enteredBy,
          zIndex,
          isTop: lastVisibleActivity?.id === activity.id,
          isActive: lastEnteredActivity?.id === activity.id,
          isRoot:
            zIndex === 0 ||
            (zIndex === 1 &&
              activity.transitionState === "enter-active" &&
              activity.enteredBy.name === "Replaced"),
          ...(activity.exitedBy
            ? {
                exitedBy: activity.exitedBy,
              }
            : null),
          ...(activity.context
            ? {
                context: activity.context,
              }
            : null),
        };
      })
      .sort((a, b) => compareBy(a, b, (activity) => activity.id)),
  };

  return output;
}
