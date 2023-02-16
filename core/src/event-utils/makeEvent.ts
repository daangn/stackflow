import type { DomainEvent } from "../event-types";
import type { BaseDomainEvent } from "../event-types/_base";
import { id, time } from "../utils";

export function makeEvent<T extends DomainEvent["name"]>(
  name: T,
  parameters: Omit<
    Extract<DomainEvent, { name: T }>,
    "id" | "name" | "eventDate"
  > &
    Partial<BaseDomainEvent>,
) {
  return {
    id: id(),
    eventDate: time(),
    ...parameters,
    name,
  } as Extract<DomainEvent, { name: T }>;
}
