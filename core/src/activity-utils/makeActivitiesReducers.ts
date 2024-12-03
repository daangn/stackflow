import type { PausedEvent } from "event-types/PausedEvent";
import type { ResumedEvent } from "event-types/ResumedEvent";
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
import { createActivityFromEvent } from "./createActivityFromEvent";
import { createReducer } from "./createReducer";
import findNewActivityIndex from "./findNewActivityIndex";

/**
 * Create activity list reducers for each event type (Activity[] + Event => Activity[])
 */
export const makeActivitiesReducers = (isTransitionDone: boolean) =>
  createReducer({
    /**
     * noop
     */
    Initialized: (
      activities: Activity[],
      event: InitializedEvent,
    ): Activity[] => activities,
    /**
     * noop
     */
    ActivityRegistered: (
      activities: Activity[],
      event: ActivityRegisteredEvent,
    ): Activity[] => activities,
    /**
     * Push new activity to activities
     */
    Pushed: (activities: Activity[], event: PushedEvent): Activity[] => {
      const transitionState: ActivityTransitionState =
        event.skipEnterActiveState || isTransitionDone
          ? "enter-done"
          : "enter-active";
      const reservedIndex = findNewActivityIndex(event, activities);
      return [
        ...activities.slice(0, reservedIndex),
        createActivityFromEvent(event, transitionState),
        ...activities.slice(reservedIndex + 1),
      ];
    },
    /**
     * Replace activity at reservedIndex with new activity
     */
    Replaced: (activities: Activity[], event: ReplacedEvent): Activity[] => {
      const reservedIndex = findNewActivityIndex(event, activities);

      // reuse state of alreadyExistingActivity
      const transitionState =
        activities[reservedIndex]?.transitionState ??
        (event.skipEnterActiveState || isTransitionDone
          ? "enter-done"
          : "enter-active");

      return [
        ...activities.slice(0, reservedIndex),
        createActivityFromEvent(event, transitionState),
        ...activities.slice(reservedIndex + 1),
      ];
    },
    /**
     * noop
     */
    Popped: (activities: Activity[], event: PoppedEvent): Activity[] =>
      activities,
    /**
     * noop
     */
    StepPushed: (activities: Activity[], event: StepPushedEvent): Activity[] =>
      activities,
    /**
     * noop
     */
    StepReplaced: (
      activities: Activity[],
      event: StepReplacedEvent,
    ): Activity[] => activities,
    /**
     * noop
     */
    StepPopped: (activities: Activity[], event: StepPoppedEvent): Activity[] =>
      activities,

    /**
     * noop
     */
    Paused: (activities: Activity[], event: PausedEvent) => activities,

    /**
     * noop
     */
    Resumed: (activities: Activity[], event: ResumedEvent) => activities,
  });
