import type { DomainEvent } from "../event-types";
import { filterEvents } from "./filterEvents";

export function validateEvents(events: DomainEvent[]) {
  if (events.length === 0) {
    throw new Error("events parameter is empty");
  }

  const initEvents = filterEvents(events, "Initialized");

  if (initEvents.length > 1) {
    throw new Error("InitializedEvent can only exist once");
  }

  const activityRegisteredEvents = filterEvents(events, "ActivityRegistered");

  const registeredActivityNames = new Set(
    activityRegisteredEvents.map((e) => e.activityName),
  );

  const pushedEvents = filterEvents(events, "Pushed");

  if (pushedEvents.some((e) => !registeredActivityNames.has(e.activityName))) {
    throw new Error("the corresponding activity does not exist");
  }
}
