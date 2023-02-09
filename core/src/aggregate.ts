import findTargetActivityIndexes from "./activity-utils/findTargetActivityIndexes";
import { makeActivitiesReducers } from "./activity-utils/makeActivitiesReducers";
import { makeActivityReducers } from "./activity-utils/makeActivityReducers";
import type { DomainEvent } from "./event-types";
import { filterEvents, validateEvents } from "./event-utils";
import type { Activity, Stack } from "./Stack";
import { compareBy, uniqBy } from "./utils";

export function aggregate(events: DomainEvent[], now: number): Stack {
  const sortedEvents = uniqBy(
    [...events].sort((a, b) => compareBy(a, b, (e) => e.id)),
    (e) => e.id,
  );

  validateEvents(sortedEvents);

  const initEvent = filterEvents(sortedEvents, "Initialized")[0];
  const activityRegisteredEvents = filterEvents(events, "ActivityRegistered");
  const { transitionDuration } = initEvent;

  const activities = sortedEvents.reduce(
    (activities: Activity[], event: DomainEvent) => {
      const isTransitionDone = now - event.eventDate >= transitionDuration;

      const targets = findTargetActivityIndexes(
        activities,
        event,
        isTransitionDone,
      );

      const activityReducer = makeActivityReducers(isTransitionDone);

      const activitiesReducer = makeActivitiesReducers(isTransitionDone);

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

  const globalTransitionState = activities.find(
    (activity) =>
      activity.transitionState === "enter-active" ||
      activity.transitionState === "exit-active",
  )
    ? "loading"
    : "idle";

  const output: Stack = {
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
          ...(activity.exitedBy
            ? {
                exitedBy: activity.exitedBy,
              }
            : null),
          isTop: lastVisibleActivity?.id === activity.id,
          isActive: lastEnteredActivity?.id === activity.id,
          isRoot:
            zIndex === 0 ||
            (zIndex === 1 &&
              activity.transitionState === "enter-active" &&
              activity.enteredBy.name === "Replaced"),
          zIndex,
          ...(activity.context
            ? {
                context: activity.context,
              }
            : null),
        };
      })
      .sort((a, b) => compareBy(a, b, (activity) => activity.id)),
    registeredActivities: activityRegisteredEvents.map((event) => ({
      name: event.activityName,
      ...(event.activityParamsSchema
        ? {
            paramsSchema: event.activityParamsSchema,
          }
        : null),
    })),
    transitionDuration,
    globalTransitionState,
  };

  return output;
}
