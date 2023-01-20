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
import { createActivityFromEvent } from "./createActivityFromEvent";
import findNewActivityIndex from "./findNewActivityIndex";

export const makeActivitiesReducers: (
  isTransitionDone: boolean,
) => Record<DomainEvent["name"], any> = (isTransitionDone: boolean) => ({
  Initialized: (activities: Activity[], event: InitializedEvent): Activity[] =>
    activities,
  ActivityRegistered: (
    activities: Activity[],
    event: ActivityRegisteredEvent,
  ): Activity[] => activities,
  Pushed: (activities: Activity[], event: PushedEvent): Activity[] => {
    const transitionState: ActivityTransitionState =
      event.skipEnterActiveState || isTransitionDone
        ? "enter-done"
        : "enter-active";
    const reservedIndex = findNewActivityIndex(event, activities);
    return [
      ...activities.slice(0, reservedIndex),
      createActivityFromEvent(event, transitionState),
      ...activities.slice(reservedIndex),
    ];
  },
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
  Popped: (activities: Activity[], event: PoppedEvent): Activity[] =>
    activities,
  StepPushed: (activities: Activity[], event: StepPushedEvent): Activity[] =>
    activities,
  StepReplaced: (
    activities: Activity[],
    event: StepReplacedEvent,
  ): Activity[] => activities,
  StepPopped: (activities: Activity[], event: StepPoppedEvent): Activity[] =>
    activities,
});
