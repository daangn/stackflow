import type { PushedEvent, ReplacedEvent } from "../event-types";
import type { Activity, ActivityTransitionState } from "../Stack";

export const createActivityFromEvent = (
  event: PushedEvent | ReplacedEvent,
  transitionState: ActivityTransitionState,
): Activity => ({
  id: event.activityId,
  name: event.activityName,
  transitionState,
  params: event.activityParams,
  context: event.activityContext,
  steps: [
    {
      id: event.activityId,
      params: event.activityParams,
      enteredBy: event,
    },
  ],
  enteredBy: event,
  isTop: false,
  isActive: false,
  isRoot: false,
  zIndex: -1,
});
