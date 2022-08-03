import type { DomainEvent } from "../event-types";
import { filterEvents } from "./filterEvents";

export function validateEvents(events: DomainEvent[]) {
  if (events.length === 0) {
    throw new Error("events parameter is empty");
  }

  const initEvents = filterEvents(events, "Initialized");
  const activityRegisteredEvents = filterEvents(events, "ActivityRegistered");
  const pushedEvents = filterEvents(events, "Pushed");

  if (initEvents.length > 1) {
    throw new Error("InitializedEvent can only exist once");
  }

  const registeredActivityNames = activityRegisteredEvents.map(
    (e) => e.activityName,
  );

  pushedEvents.forEach((e) => {
    if (!registeredActivityNames.includes(e.activityName)) {
      throw new Error("the corresponding activity does not exist");
    }
  });
}
