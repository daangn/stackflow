import { createActivityFromEvent } from "./activity-utils/createActivityFromEvent";
import type { DomainEvent, PoppedEvent, ReplacedEvent } from "./event-types";
import { filterEvents, validateEvents } from "./event-utils";
import type { Activity, ActivityTransitionState, Stack } from "./Stack";
import { compareBy, findIndices, last, uniqBy } from "./utils";

export function aggregate(events: DomainEvent[], now: number): Stack {
  const sortedEvents = uniqBy(
    [...events].sort((a, b) => compareBy(a, b, (e) => e.id)),
    (e) => e.id,
  );

  validateEvents(sortedEvents);

  const initEvent = filterEvents(sortedEvents, "Initialized")[0];
  const activityRegisteredEvents = filterEvents(events, "ActivityRegistered");
  const { transitionDuration } = initEvent;

  type ActivityMetadata = {
    poppedBy: PoppedEvent | ReplacedEvent | null;
  };

  const activities: Array<
    Activity & {
      metadata: ActivityMetadata;
    }
  > = [];

  sortedEvents.forEach((event) => {
    switch (event.name) {
      case "Pushed": {
        const isTransitionDone = now - event.eventDate >= transitionDuration;
        const transitionState: ActivityTransitionState =
          event.skipEnterActiveState || isTransitionDone
            ? "enter-done"
            : "enter-active";

        activities.push(createActivityFromEvent(event, transitionState));

        break;
      }
      case "Replaced": {
        const alreadyExistingActivityIndex = last(
          findIndices(
            activities,
            (activity) => activity.id === event.activityId,
          ),
        );

        if (typeof alreadyExistingActivityIndex === "number") {
          const alreadyExistingActivity =
            activities[alreadyExistingActivityIndex];

          const { transitionState } = alreadyExistingActivity;

          activities[alreadyExistingActivityIndex] = createActivityFromEvent(
            event,
            transitionState,
          );

          break;
        }

        const isTransitionDone = now - event.eventDate >= transitionDuration;
        const transitionState: ActivityTransitionState =
          event.skipEnterActiveState || isTransitionDone
            ? "enter-done"
            : "enter-active";

        const recentActivities = activities.sort(
          (a1, a2) => a2.pushedBy.eventDate - a1.pushedBy.eventDate,
        );

        if (transitionState === "enter-done") {
          for (let i = 0; i < recentActivities.length; i += 1) {
            recentActivities[i].metadata.poppedBy = event;
            recentActivities[i].transitionState = "exit-done";

            if (recentActivities[i].pushedBy.name === "Pushed") break;
          }
        }

        activities.push(createActivityFromEvent(event, transitionState));

        break;
      }
      case "Popped": {
        const targetActivity = activities
          .slice(1)
          .filter((activity) => activity.metadata.poppedBy === null)
          .sort((a1, a2) => a2.pushedBy.eventDate - a1.pushedBy.eventDate)[0];

        const isTransitionDone = now - event.eventDate >= transitionDuration;
        const transitionState: ActivityTransitionState =
          event.skipExitActiveState || isTransitionDone
            ? "exit-done"
            : "exit-active";

        if (targetActivity) {
          targetActivity.metadata.poppedBy = event;
          targetActivity.transitionState = transitionState;

          if (transitionState === "exit-done") {
            targetActivity.params = targetActivity.steps[0].params;
            targetActivity.steps = [targetActivity.steps[0]];
          }
        }

        break;
      }
      case "StepPushed": {
        const targetActivity = activities
          .filter((activity) => activity.metadata.poppedBy === null)
          .sort((a1, a2) => a2.pushedBy.eventDate - a1.pushedBy.eventDate)[0];

        if (targetActivity) {
          const newRoute = {
            id: event.stepId,
            params: event.stepParams,
            pushedBy: event,
          };

          targetActivity.params = event.stepParams;
          targetActivity.steps = targetActivity.steps
            ? [...targetActivity.steps, newRoute]
            : [newRoute];
        }
        break;
      }
      case "StepReplaced": {
        const targetActivity = activities
          .filter((activity) => activity.metadata.poppedBy === null)
          .sort((a1, a2) => a2.pushedBy.eventDate - a1.pushedBy.eventDate)[0];

        if (targetActivity) {
          targetActivity.params = event.stepParams;

          const newRoute = {
            id: event.stepId,
            params: event.stepParams,
            pushedBy: event,
          };

          targetActivity.steps.pop();
          targetActivity.steps = [...targetActivity.steps, newRoute];
        }
        break;
      }
      case "StepPopped": {
        const targetActivity = activities
          .filter((activity) => activity.metadata.poppedBy === null)
          .sort((a1, a2) => a2.pushedBy.eventDate - a1.pushedBy.eventDate)[0];

        if (targetActivity && targetActivity.steps.length > 1) {
          targetActivity.steps.pop();

          const beforeActivityParams = last(targetActivity.steps)?.params;

          if (beforeActivityParams) {
            targetActivity.params = beforeActivityParams;
          }
        }

        break;
      }
      default: {
        break;
      }
    }
  });

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
          pushedBy: activity.pushedBy,
          isTop: lastVisibleActivity?.id === activity.id,
          isActive: lastEnteredActivity?.id === activity.id,
          isRoot:
            zIndex === 0 ||
            (zIndex === 1 &&
              activity.transitionState === "enter-active" &&
              activity.pushedBy.name === "Replaced"),
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
