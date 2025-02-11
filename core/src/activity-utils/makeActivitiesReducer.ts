import type { Activity, ActivityTransitionState } from "../Stack";
import type { DomainEvent, PushedEvent, ReplacedEvent } from "../event-types";
import { findNewActivityIndex } from "./findNewActivityIndex";
import { makeActivityFromEvent } from "./makeActivityFromEvent";
import { makeReducer } from "./makeReducer";

function noop(activities: Activity[]) {
  return activities;
}

/**
 * Create activity list reducers for each event type (Activity[] + Event => Activity[])
 */
export function makeActivitiesReducer({
  transitionDuration,
  now,
  resumedAt,
}: {
  transitionDuration: number;
  now: number;
  resumedAt?: number;
}) {
  return makeReducer({
    /**
     * Push new activity to activities
     */
    Pushed(activities: Activity[], event: PushedEvent): Activity[] {
      const isTransitionDone =
        now - (resumedAt ?? event.eventDate) >= transitionDuration;

      const transitionState: ActivityTransitionState =
        event.skipEnterActiveState || isTransitionDone
          ? "enter-done"
          : "enter-active";

      const reservedIndex = findNewActivityIndex(activities, event);

      return [
        ...activities.slice(0, reservedIndex),
        makeActivityFromEvent(event, transitionState),
        ...activities.slice(reservedIndex + 1),
      ];
    },

    /**
     * Replace activity at reservedIndex with new activity
     */
    Replaced(activities: Activity[], event: ReplacedEvent): Activity[] {
      const isTransitionDone =
        now - (resumedAt ?? event.eventDate) >= transitionDuration;

      const reservedIndex = findNewActivityIndex(activities, event);

      // reuse state of alreadyExistingActivity
      const transitionState =
        activities[reservedIndex]?.transitionState ??
        (event.skipEnterActiveState || isTransitionDone
          ? "enter-done"
          : "enter-active");

      return [
        ...activities.slice(0, reservedIndex),
        makeActivityFromEvent(event, transitionState),
        ...activities.slice(reservedIndex + 1),
      ];
    },

    /**
     * noop
     */
    Initialized: noop,
    ActivityRegistered: noop,
    Popped: noop,
    StepPushed: noop,
    StepReplaced: noop,
    StepPopped: noop,
    Paused: noop,
    Resumed: noop,
  });
}
