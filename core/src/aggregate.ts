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
  const activityRegisteredEvents = filterEvents(events, "ActivityRegistered");

  const registeredActivityNames = activityRegisteredEvents.map(
    (e) => e.activityName,
  );

  type ActivityMetadata = {
    pushedBy: PushedEvent;
    poppedBy: PoppedEvent | null;
  };

  const activities: Array<
    Activity & {
      metadata: ActivityMetadata;
    }
  > = [];

  events.forEach((e) => {
    switch (e.name) {
      case "Pushed": {
        const transitionState: ActivityTransitionState =
          now - e.eventDate >= initEvent.transitionDuration
            ? "enter-done"
            : "enter-active";

        activities.push({
          activityId: e.activityId,
          activityName: e.activityName,
          transitionState,
          metadata: {
            pushedBy: e,
            poppedBy: null,
          },
        });

        break;
      }
      case "Popped": {
        const targetActivity = activities
          .filter((a) => a.metadata.poppedBy === null)
          .sort(
            (a, b) =>
              b.metadata.pushedBy.eventDate - a.metadata.pushedBy.eventDate,
          )[0];

        if (!targetActivity) {
          return;
        }

        const transitionState: ActivityTransitionState =
          now - e.eventDate >= initEvent.transitionDuration
            ? "exit-done"
            : "exit-active";

        targetActivity.metadata.poppedBy = e;
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
      activityId: a.activityId,
      activityName: a.activityName,
      transitionState: a.transitionState,
    })),
    globalTransitionState,
  };
}
