import { DomainEvent } from "../event-types";
import { BaseDomainEvent } from "../event-types/_base";
import { id } from "../utils";

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
    name,
    eventDate: new Date().getTime(),
    ...parameters,
  } as Extract<DomainEvent, { name: T }>;
}
