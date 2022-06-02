import { DomainEvent } from "../event-types";

export function compareEventsById(event1: DomainEvent, event2: DomainEvent) {
  if (event1.id < event2.id) {
    return -1;
  }
  if (event1.id === event2.id) {
    return 0;
  }
  return 1;
}
