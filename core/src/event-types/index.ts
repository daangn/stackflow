import type { ActivityRegisteredEvent } from "./ActivityRegisteredEvent";
import type { InitializedEvent } from "./InitializedEvent";
import type { PoppedEvent } from "./PoppedEvent";
import type { PushedEvent } from "./PushedEvent";
import type { ReplacedEvent } from "./ReplacedEvent";

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
