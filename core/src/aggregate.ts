import type { Activity, Stack } from "./Stack";
import findTargetActivityIndexes from "./activity-utils/findTargetActivityIndexes";
import { makeActivitiesReducers } from "./activity-utils/makeActivitiesReducers";
import { makeActivityReducers } from "./activity-utils/makeActivityReducers";
import type { DomainEvent } from "./event-types";
import { filterEvents, validateEvents } from "./event-utils";
import { compareBy, uniqBy } from "./utils";

export function aggregate(inputEvents: DomainEvent[], now: number): Stack {
  /**
   * 1. Sorting by event ID (K-Sortable)
   *
   * The backward action may cause past events to be put behind, so when those events are dispatched, move them forward.
   */
  const sortedEvents = uniqBy(
    [...inputEvents].sort((a, b) => compareBy(a, b, (e) => e.id)),
    (e) => e.id,
  );

  /**
   * 2. Handle `PausedEvent` and `ResumedEvent`
   *
   * 2-1. If a `PausedEvent` is fired, handle it so that all events after the pause are deleted
   * (Transitions of events that have already happened will ensure normal behavior)
   * 2-2. If a `ResumedEvent` is fired, handle it by delaying the `eventCreatedAt` of events
   * after the pause by that much (`dt`)
   */
  const pauseAndResumeHandledEvents: DomainEvent[] = [];
  let eventBufferAfterPaused: DomainEvent[] = [];

  let pausedAt: number | null = null;

  for (const event of sortedEvents) {
    if (event.name === "Paused") {
      pausedAt = event.eventDate;
      continue;
    }
    if (event.name === "Resumed" && pausedAt) {
      const dt = event.eventDate - pausedAt;

      for (const pausedEvent of eventBufferAfterPaused) {
        pauseAndResumeHandledEvents.push({
          ...pausedEvent,
          eventDate: pausedEvent.eventDate + dt,
        });
      }

      pausedAt = null;
      eventBufferAfterPaused = [];
      continue;
    }

    if (pausedAt) {
      eventBufferAfterPaused.push(event);
    } else {
      pauseAndResumeHandledEvents.push(event);
    }
  }

  const events = pauseAndResumeHandledEvents;

  validateEvents(events);

  const initEvent = filterEvents(events, "Initialized")[0];
  const activityRegisteredEvents = filterEvents(
    inputEvents,
    "ActivityRegistered",
  );
  const { transitionDuration } = initEvent;

  const activities = events.reduce(
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

  const globalTransitionState = pausedAt
    ? "paused"
    : activities.find(
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
