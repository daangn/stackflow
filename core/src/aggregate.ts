import sortBy from "lodash/sortBy";

import { AggregateOutput } from "./AggregateOutput";
import { Event, PushedEvent } from "./events";
import { filterEvents } from "./filterEvents";
import { uniqBy } from "./uniqBy";

const isActivityIdDuplicated = (pushedEvents: PushedEvent[]) =>
  uniqBy(pushedEvents, (e) => e.activityId).length !== pushedEvents.length;

export function aggregate(events: Event[], now: number): AggregateOutput {
  if (events.length === 0) {
    throw new Error("events parameter is empty");
  }

  const initEvents = filterEvents(events, "Initialized");

  if (initEvents.length > 1) {
    throw new Error("InitializedEvent can only exist once");
  }

  const activityRegisteredEvents = filterEvents(events, "ActivityRegistered");
  const pushedEvents = filterEvents(events, "Pushed");

  const registeredActivityNames = activityRegisteredEvents.map(
    (e) => e.activityName,
  );

  pushedEvents.forEach((e) => {
    if (!registeredActivityNames.includes(e.activityName)) {
      throw new Error("the corresponding activity does not exist");
    }
  });

  if (isActivityIdDuplicated(pushedEvents)) {
    throw new Error("activityId is duplicate");
  }

  const initEvent = initEvents[0];
  const latestPushEvent = sortBy(pushedEvents, ["eventDate"])[0];

  const transitionState = (() => {
    if (!latestPushEvent) {
      return "idle" as const;
    }
    if (now - latestPushEvent.eventDate >= initEvent.transitionDuration) {
      return "idle" as const;
    }

    return "loading" as const;
  })();

  return {
    activities: [
      ...pushedEvents
        .filter((e) => registeredActivityNames.includes(e.activityName))
        .map((e) => ({
          activityId: e.activityId,
          activityName: e.activityName,
        })),
    ],
    transition: {
      state: transitionState,
    },
  };
}
