import type { Activity, Stack } from "../Stack";
import type {
  ActivityRegisteredEvent,
  DomainEvent,
  InitializedEvent,
  PausedEvent,
  ResumedEvent,
} from "../event-types";
import { findTargetActivityIndices } from "./findTargetActivityIndices";
import { makeActivitiesReducer } from "./makeActivitiesReducer";
import { makeActivityReducer } from "./makeActivityReducer";
import { makeReducer } from "./makeReducer";

function withPauseReducer<T extends DomainEvent>(
  reducer: (stack: Stack, event: T) => Stack,
) {
  return (stack: Stack, event: T) => {
    if (stack.globalTransitionState === "paused") {
      return {
        ...stack,
        pausedEvents: stack.pausedEvents
          ? [...stack.pausedEvents, event]
          : [event],
      };
    }

    return reducer(stack, event);
  };
}

function withActivitiesReducer<T extends DomainEvent>(
  reducer: (stack: Stack, event: T) => Stack,
  context: {
    now: number;
    resumedAt?: number;
  },
) {
  return (stack: Stack, event: T) => {
    const activitiesReducer = makeActivitiesReducer({
      transitionDuration: stack.transitionDuration,
      now: context.now,
      resumedAt: context.resumedAt,
    });

    const activityReducer = makeActivityReducer({
      transitionDuration: stack.transitionDuration,
      now: context.now,
      resumedAt: context.resumedAt,
    });

    const activities = activitiesReducer(stack.activities, event);

    const targetActivityIndices = findTargetActivityIndices(
      stack.activities,
      event,
      { transitionDuration: stack.transitionDuration, now: context.now },
    );

    for (const targetActivityIndex of targetActivityIndices) {
      activities[targetActivityIndex] = activityReducer(
        activities[targetActivityIndex],
        event,
      );
    }

    const isLoading = activities.find(
      (activity) =>
        activity.transitionState === "enter-active" ||
        activity.transitionState === "exit-active",
    );

    const globalTransitionState =
      stack.globalTransitionState === "paused"
        ? "paused"
        : isLoading
          ? "loading"
          : "idle";

    return reducer({ ...stack, activities, globalTransitionState }, event);
  };
}

function noop(stack: Stack) {
  return stack;
}

export function makeStackReducer(context: {
  now: number;
  resumedAt?: number;
}) {
  return makeReducer({
    Initialized: withPauseReducer(
      withActivitiesReducer((stack: Stack, event: InitializedEvent): Stack => {
        return {
          ...stack,
          transitionDuration: event.transitionDuration,
        };
      }, context),
    ),
    ActivityRegistered: withPauseReducer(
      withActivitiesReducer(
        (stack: Stack, event: ActivityRegisteredEvent): Stack => {
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
        },
        context,
      ),
    ),
    Paused: withPauseReducer(
      withActivitiesReducer((stack: Stack, event: PausedEvent): Stack => {
        return {
          ...stack,
          globalTransitionState: "paused",
        };
      }, context),
    ),
    Resumed: withActivitiesReducer(
      (stack: Stack, event: ResumedEvent): Stack => {
        if (stack.globalTransitionState !== "paused" || !stack.pausedEvents) {
          return stack;
        }

        const reducer = makeStackReducer({
          now: context.now,
          resumedAt: event.eventDate,
        });

        const { pausedEvents, ...rest } = stack;
        return pausedEvents.reduce(reducer, {
          ...rest,
          globalTransitionState: "idle",
        });
      },
      context,
    ),
    Pushed: withPauseReducer(withActivitiesReducer(noop, context)),
    Replaced: withPauseReducer(withActivitiesReducer(noop, context)),
    Popped: withPauseReducer(withActivitiesReducer(noop, context)),
    StepPushed: withPauseReducer(withActivitiesReducer(noop, context)),
    StepReplaced: withPauseReducer(withActivitiesReducer(noop, context)),
    StepPopped: withPauseReducer(withActivitiesReducer(noop, context)),
  });
}
