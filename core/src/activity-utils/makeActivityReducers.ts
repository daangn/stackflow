import type {
  ActivityRegisteredEvent,
  DomainEvent,
  InitializedEvent,
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "../event-types";
import type { Activity, ActivityTransitionState } from "../Stack";
import { last } from "../utils";

// TODO: If transitionDuration is in event, only 'now' param is required
export const makeActivityReducers: (
  isTransitionDone: boolean,
) => Record<
  DomainEvent["name"],
  (activity: Activity, event: any) => Activity
> = (isTransitionDone: boolean) =>
  ({
    Initialized: (activity: Activity, event: InitializedEvent): Activity =>
      activity,
    ActivityRegistered: (
      activity: Activity,
      event: ActivityRegisteredEvent,
    ): Activity => activity,
    Pushed: (activity: Activity, event: PushedEvent): Activity => activity,
    Replaced: (activity: Activity, event: ReplacedEvent): Activity => ({
      ...activity,
      exitedBy: event,
      transitionState: "exit-done",
    }),
    Popped: (activity: Activity, event: PoppedEvent): Activity => {
      const transitionState: ActivityTransitionState =
        event.skipExitActiveState || isTransitionDone
          ? "exit-done"
          : "exit-active";

      return {
        ...activity,
        exitedBy: event,
        transitionState,
        params:
          transitionState === "exit-done"
            ? activity.steps[0].params
            : activity.params,
        steps:
          transitionState === "exit-done"
            ? [activity.steps[0]]
            : activity.steps,
      };
    },
    StepPushed: (activity: Activity, event: StepPushedEvent): Activity => {
      const newRoute = {
        id: event.stepId,
        params: event.stepParams,
        enteredBy: event,
      };

      return {
        ...activity,
        params: event.stepParams,
        steps: [...activity.steps, newRoute],
      };
    },
    StepReplaced: (activity: Activity, event: StepReplacedEvent): Activity => {
      const newRoute = {
        id: event.stepId,
        params: event.stepParams,
        enteredBy: event,
      };

      return {
        ...activity,
        params: event.stepParams,
        steps: [
          ...activity.steps.slice(0, activity.steps.length - 1),
          newRoute,
        ],
      };
    },
    StepPopped: (activity: Activity, event: StepPoppedEvent): Activity => {
      activity.steps.pop();

      const beforeActivityParams = last(activity.steps)?.params;

      return {
        ...activity,
        params: beforeActivityParams ?? activity.params,
      };
    },
  } as const);
