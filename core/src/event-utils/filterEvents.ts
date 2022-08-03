import type { DomainEvent } from "../event-types";

export function filterEvents<T extends DomainEvent["name"]>(
  events: DomainEvent[],
  eventName: T,
) {
  return events.filter((e) => e.name === eventName) as Array<
    Extract<DomainEvent, { name: T }>
  >;
}
