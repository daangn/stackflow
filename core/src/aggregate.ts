import type { ActivityStep, Stack } from "./Stack";
import { makeStackReducer } from "./activity-utils/makeStackReducer";
import type { DomainEvent } from "./event-types";
import { validateEvents } from "./event-utils";
import { compareBy, last, uniqBy } from "./utils";

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
  const stackReducer = makeStackReducer({ now });
  const stack = events.reduce(stackReducer, {
    activities: [],
    globalTransitionState: "idle",
    registeredActivities: [],
    transitionDuration: 0,
  });

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
        let zIndex = visibleActivities.findIndex(
          ({ id }) => id === activity.id,
        );

        const beforeActivities = visibleActivities.slice(0, zIndex);

        for (const beforeActivity of beforeActivities) {
          for (const step of beforeActivity.steps) {
            if (step.hasZIndex) {
              zIndex += 1;
            }
          }
        }

        const steps = activity.steps.reduce<ActivityStep[]>((acc, step) => {
          const lastStep = last(acc);
          const lastStepZIndex = lastStep?.zIndex ?? zIndex;

          return [
            ...acc,
            {
              ...step,
              zIndex: lastStepZIndex + (step.hasZIndex ? 1 : 0),
            },
          ];
        }, []);

        return {
          id: activity.id,
          name: activity.name,
          transitionState: activity.transitionState,
          params: activity.params,
          steps,
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
