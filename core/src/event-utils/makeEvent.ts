import type { DomainEvent } from "../event-types";
import type { BaseDomainEvent } from "../event-types/_base";
import { id } from "../utils";

let dt = 0;
let memt = 0;

const time = () => {
  const t = new Date().getTime();

  if (memt === t) {
    dt += 1;
  } else {
    memt = t;
    dt = 0;
  }

  return (t * 1000 + dt) / 1000;
};

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
