import type { Activity, ActivityTransitionState } from "../Stack";
import type {
  DomainEvent,
  PoppedEvent,
  ReplacedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "../event-types";
import { last } from "../utils";
import { makeReducer } from "./makeReducer";

function noop(activity: Activity) {
  return activity;
}

/**
 * Create activity reducers for each event type (Activity + Event => Activity)
 */
export function makeActivityReducer(context: {
  transitionDuration: number;
  now: number;
}) {
  return makeReducer({
    /**
     * Change transition state to exit-done
     */
    Replaced: (activity: Activity, event: ReplacedEvent): Activity => ({
      ...activity,
      exitedBy: event,
      transitionState: "exit-done",
    }),

    /**
     * Change transition state to exit-done or exit-active depending on skipExitActiveState
     */
    Popped: (activity: Activity, event: PoppedEvent): Activity => {
      const isTransitionDone =
        context.now - event.eventDate >= context.transitionDuration;

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

    /**
     * Replace step params
     * Push new step
     */
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

    /**
     * Replace step params
     * Replace the last step
     */
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

    /**
     * Pop the last step
     * If there are params in the previous step, set them as the new params
     */
    StepPopped: (activity: Activity, event: StepPoppedEvent): Activity => {
      activity.steps.pop();

      const beforeActivityParams = last(activity.steps)?.params;

      return {
        ...activity,
        params: beforeActivityParams ?? activity.params,
      };
    },

    /**
     * noop
     */
    Initialized: noop,
    ActivityRegistered: noop,
    Pushed: noop,
    Paused: noop,
    Resumed: noop,
  } as const);
}
