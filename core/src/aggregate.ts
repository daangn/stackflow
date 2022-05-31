import {
  Activity,
  ActivityTransitionState,
  AggregateOutput,
} from "./AggregateOutput";
import { DomainEvent, PoppedEvent, PushedEvent } from "./event-types";
import { filterEvents, validateEvents } from "./event-utils";

export function aggregate(events: DomainEvent[], now: number): AggregateOutput {
  validateEvents(events);

  const initEvent = filterEvents(events, "Initialized")[0];

  type ActivityMetadata = {
    pushedBy: PushedEvent;
    poppedBy: PoppedEvent | null;
  };

  const activities: Array<
    Activity & {
      metadata: ActivityMetadata;
    }
  > = [];

  events.forEach((event) => {
    switch (event.name) {
      case "Pushed": {
        const transitionState: ActivityTransitionState =
          now - event.eventDate >= initEvent.transitionDuration
            ? "enter-done"
            : "enter-active";

        activities.push({
          id: event.activityId,
          name: event.activityName,
          transitionState,
          metadata: {
            pushedBy: event,
            poppedBy: null,
          },
        });

        break;
      }
      case "Popped": {
        const targetActivity = activities
          .filter((_, i) => i > 0)
          .filter((a) => a.metadata.poppedBy === null)
          .sort(
            (a, b) =>
              b.metadata.pushedBy.eventDate - a.metadata.pushedBy.eventDate,
          )[0];

        if (!targetActivity) {
          return;
        }

        const transitionState: ActivityTransitionState =
          now - event.eventDate >= initEvent.transitionDuration
            ? "exit-done"
            : "exit-active";

        targetActivity.metadata.poppedBy = event;
        targetActivity.transitionState = transitionState;

        break;
      }
      default: {
        break;
      }
    }
  });

  const globalTransitionState = activities.find(
    (a) =>
      a.transitionState === "enter-active" ||
      a.transitionState === "exit-active",
  )
    ? "loading"
    : "idle";

  return {
    activities: activities.map((a) => ({
      id: a.id,
      name: a.name,
      transitionState: a.transitionState,
    })),
    globalTransitionState,
  };
}
