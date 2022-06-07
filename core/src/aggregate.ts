import {
  Activity,
  ActivityTransitionState,
  AggregateOutput,
} from "./AggregateOutput";
import { DomainEvent, PoppedEvent, ReplacedEvent } from "./event-types";
import { filterEvents, validateEvents } from "./event-utils";
import { compareBy, uniqBy } from "./utils";

export function aggregate(events: DomainEvent[], now: number): AggregateOutput {
  const _events = uniqBy(
    [...events].sort((a, b) => compareBy(a, b, (e) => e.id)),
    (e) => e.id,
  );

  validateEvents(_events);

  const initEvent = filterEvents(_events, "Initialized")[0];
  const { transitionDuration } = initEvent;

  type ActivityMetadata = {
    poppedBy: PoppedEvent | ReplacedEvent | null;
  };

  const activities: Array<
    Activity & {
      metadata: ActivityMetadata;
    }
  > = [];

  _events.forEach((event) => {
    switch (event.name) {
      case "Pushed": {
        const transitionState: ActivityTransitionState =
          now - event.eventDate >= transitionDuration
            ? "enter-done"
            : "enter-active";

        activities.push({
          id: event.activityId,
          name: event.activityName,
          transitionState,
          params: event.params,
          pushedBy: event,
          metadata: {
            poppedBy: null,
          },
        });

        break;
      }
      case "Replaced": {
        const transitionState: ActivityTransitionState =
          now - event.eventDate >= transitionDuration
            ? "enter-done"
            : "enter-active";

        const targetActivity = activities
          .filter((a) => a.metadata.poppedBy === null)
          .sort((a, b) => b.pushedBy.eventDate - a.pushedBy.eventDate)[0];

        activities.push({
          id: event.activityId,
          name: event.activityName,
          transitionState,
          params: event.params,
          pushedBy: event,
          metadata: {
            poppedBy: null,
          },
        });

        if (transitionState === "enter-done") {
          targetActivity.metadata.poppedBy = event;
          targetActivity.transitionState = "exit-done";
        }

        break;
      }
      case "Popped": {
        const targetActivity = activities
          .filter((_, i) => i > 0)
          .filter((a) => a.metadata.poppedBy === null)
          .sort((a, b) => b.pushedBy.eventDate - a.pushedBy.eventDate)[0];

        if (!targetActivity) {
          return;
        }

        const transitionState: ActivityTransitionState =
          now - event.eventDate >= transitionDuration
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
    (activity) =>
      activity.transitionState === "enter-active" ||
      activity.transitionState === "exit-active",
  )
    ? "loading"
    : "idle";

  const output: AggregateOutput = {
    activities: uniqBy(
      activities.map((activity) => ({
        id: activity.id,
        name: activity.name,
        transitionState: activity.transitionState,
        params: activity.params,
        pushedBy: activity.pushedBy,
      })),
      (activity) => activity.id,
    ).sort((a, b) => compareBy(a, b, (activity) => activity.id)),
    globalTransitionState,
  };

  return output;
}
