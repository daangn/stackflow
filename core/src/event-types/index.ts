import { ActivityRegisteredEvent } from "./ActivityRegisteredEvent";
import { InitializedEvent } from "./InitializedEvent";
import { PoppedEvent } from "./PoppedEvent";
import { PushedEvent } from "./PushedEvent";
import { ReplacedEvent } from "./ReplacedEvent";

export type DomainEvent =
  | ActivityRegisteredEvent
  | InitializedEvent
  | PoppedEvent
  | PushedEvent
  | ReplacedEvent;

export * from "./ActivityRegisteredEvent";
export * from "./InitializedEvent";
export * from "./PoppedEvent";
export * from "./PushedEvent";
export * from "./ReplacedEvent";
