import { DomainEvent } from "../event-types";
import { BaseDomainEvent } from "../event-types/_base";

export type DispatchEvent = <T extends DomainEvent["name"]>(
  name: T,
  parameters: Omit<
    Extract<DomainEvent, { name: T }>,
    "id" | "name" | "eventDate"
  > &
    Partial<BaseDomainEvent>,
) => void;
