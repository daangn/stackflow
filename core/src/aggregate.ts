import {
  Activity,
  ActivityTransitionState,
  AggregateOutput,
} from "./AggregateOutput";
import { DomainEvent } from "./event-types";
import { filterEvents, validateEvents } from "./event-utils";

export function aggregate(events: DomainEvent[], now: number): AggregateOutput {
  validateEvents(events);

  const initEvent = filterEvents(events, "Initialized")[0];
  const activityRegisteredEvents = filterEvents(events, "ActivityRegistered");

  const registeredActivityNames = activityRegisteredEvents.map(
    (e) => e.activityName,
  );

  const activities: Array<Activity> = [];

  events.forEach((e) => {
    switch (e.name) {
      case "Pushed": {
        if (!registeredActivityNames.includes(e.activityName)) {
          return;
        }

        const transitionState: ActivityTransitionState =
          now - e.eventDate >= initEvent.transitionDuration
            ? "enter-done"
            : "enter-active";

        activities.push({
          activityId: e.activityId,
          activityName: e.activityName,
          transitionState,
        });

        break;
      }
      case "Popped": {
        activities.splice(activities.length - 1, 1);
        break;
      }
      default: {
        break;
      }
    }
  });

  const globalTransitionState = activities.find(
    (a) => a.transitionState === "enter-active",
  )
    ? "loading"
    : "idle";

  return {
    activities,
    globalTransitionState,
  };
}
