import { id } from "kuuid";

import { BaseEvent } from "./$base/BaseEvent";
import { Event } from "./events";

export function event<EventName extends Event["name"]>(
  eventName: EventName,
  params: Omit<
    Extract<Event, { name: EventName }>,
    "id" | "name" | "eventDate"
  > &
    Partial<BaseEvent>,
) {
  return {
    id: id(),
    name: eventName,
    eventDate: new Date().getTime(),
    ...params,
  } as Extract<Event, { name: EventName }>;
}
