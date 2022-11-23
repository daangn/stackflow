import type {
  Activity,
  ActivityTransitionState,
  AggregateOutput,
} from "./AggregateOutput";
import type { DomainEvent, PoppedEvent, ReplacedEvent } from "./event-types";
import { filterEvents, validateEvents } from "./event-utils";
import { compareBy, findIndices, last, uniqBy } from "./utils";

export function aggregate(events: DomainEvent[], now: number): AggregateOutput {
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
        const transitionState: ActivityTransitionState =
          event.skipEnterActiveState ||
          now - event.eventDate >= transitionDuration
            ? "enter-done"
            : "enter-active";

        activities.push({
          id: event.activityId,
          name: event.activityName,
          transitionState,
          params: event.activityParams,
          context: event.activityContext,
          steps: [
            {
              id: event.activityId,
              params: event.activityParams,
              pushedBy: event,
            },
          ],
          pushedBy: event,
          metadata: {
            poppedBy: null,
          },
          isTop: false,
          isActive: false,
          zIndex: -1,
        });

        break;
      }
      case "Replaced": {
        const alreadyExistingActivityIndex = last(
          findIndices(
            activities,
            (activity) => activity.id === event.activityId,
          ),
        );
        const alreadyExistingActivity =
          typeof alreadyExistingActivityIndex === "number"
            ? activities[alreadyExistingActivityIndex]
            : undefined;

        const transitionState: ActivityTransitionState = alreadyExistingActivity
          ? alreadyExistingActivity.transitionState
          : event.skipEnterActiveState ||
            now - event.eventDate >= transitionDuration
          ? "enter-done"
          : "enter-active";

        const newActivity = {
          id: event.activityId,
          name: event.activityName,
          transitionState,
          params: event.activityParams,
          context: event.activityContext,
          steps: [
            {
              id: event.activityId,
              params: event.activityParams,
              pushedBy: event,
            },
          ],
          pushedBy: event,
          metadata: {
            poppedBy: null,
          },
          isTop: false,
          isActive: false,
          zIndex: -1,
        };

        if (typeof alreadyExistingActivityIndex === "number") {
          activities[alreadyExistingActivityIndex] = newActivity;
        } else {
          const topActivity = activities
            .filter((activity) => activity.metadata.poppedBy === null)
            .sort((a1, a2) => a2.pushedBy.eventDate - a1.pushedBy.eventDate)[0];

          activities.push(newActivity);

          if (topActivity && transitionState === "enter-done") {
            topActivity.metadata.poppedBy = event;
            topActivity.transitionState = "exit-done";
          }
        }

        break;
      }
      case "Popped": {
        const targetActivity = activities
          .filter((_, i) => i > 0)
          .filter((activity) => activity.metadata.poppedBy === null)
          .sort((a1, a2) => a2.pushedBy.eventDate - a1.pushedBy.eventDate)[0];

        const transitionState: ActivityTransitionState =
          event.skipExitActiveState ||
          now - event.eventDate >= transitionDuration
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

  const output: AggregateOutput = {
    activities: uniqActivities
      .map((activity) => ({
        id: activity.id,
        name: activity.name,
        transitionState: activity.transitionState,
        params: activity.params,
        steps: activity.steps,
        pushedBy: activity.pushedBy,
        isTop: lastVisibleActivity?.id === activity.id,
        isActive: lastEnteredActivity?.id === activity.id,
        zIndex: visibleActivities.findIndex(({ id }) => id === activity.id),
        ...(activity.context
          ? {
              context: activity.context,
            }
          : null),
      }))
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
