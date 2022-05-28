import { ActivityRegisteredEvent } from "./ActivityRegisteredEvent";
import { InitializedEvent } from "./InitializedEvent";
import { PoppedEvent } from "./PoppedEvent";
import { PushedEvent } from "./PushedEvent";

export type DomainEvent =
  | ActivityRegisteredEvent
  | InitializedEvent
  | PoppedEvent
  | PushedEvent;

export * from "./ActivityRegisteredEvent";
export * from "./InitializedEvent";
export * from "./PoppedEvent";
export * from "./PushedEvent";
