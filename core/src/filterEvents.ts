import { Event } from "./events";

export function filterEvents<T extends Event["name"]>(
  events: Event[],
  eventName: T,
) {
  return events.filter((e) => e.name === eventName) as Array<
    Extract<Event, { name: T }>
  >;
}
