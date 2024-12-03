import type { Activity, ActivityTransitionState } from "../Stack";
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
import { last } from "../utils";
import { createReducer } from "./createReducer";

/**
 * Create activity reducers for each event type (Activity + Event => Activity)
 */
export const makeActivityReducers = (isTransitionDone: boolean) =>
  createReducer({
    /**
     * noop
     */
    Initialized: (activity: Activity, event: InitializedEvent): Activity =>
      activity,
    /**
     * noop
     */
    ActivityRegistered: (
      activity: Activity,
      event: ActivityRegisteredEvent,
    ): Activity => activity,
    /**
     * noop
     */
    Pushed: (activity: Activity, event: PushedEvent): Activity => activity,
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
    Paused: (activity: Activity) => activity,

    /**
     * noop
     */
    Resumed: (activity: Activity) => activity,
  } as const);
