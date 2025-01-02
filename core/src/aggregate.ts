import type { Stack } from "./Stack";
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
  const initializedEvent = filterEvents(events, "Initialized")[0];
  const initialStackState: Stack = {
    activities: [],
    globalTransitionState: "idle",
    registeredActivities: [],
    transitionDuration: 0,
  };
  const stackReducer = makeStackReducer({ now, initializedEvent });
  const stack = events.reduce(stackReducer, initialStackState);

  /**
   * 4. Post-process
   */
  const visibleActivities = stack.activities.filter(
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
    activities: stack.activities
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
