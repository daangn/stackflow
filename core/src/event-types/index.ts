import type { ActivityRegisteredEvent } from "./ActivityRegisteredEvent";
import type { InitializedEvent } from "./InitializedEvent";
import type { NestedPoppedEvent } from "./NestedPoppedEvent";
import type { NestedPushedEvent } from "./NestedPushedEvent";
import type { NestedReplacedEvent } from "./NestedReplacedEvent";
import type { PoppedEvent } from "./PoppedEvent";
import type { PushedEvent } from "./PushedEvent";
import type { ReplacedEvent } from "./ReplacedEvent";

export type DomainEvent =
  | ActivityRegisteredEvent
  | InitializedEvent
  | NestedPoppedEvent
  | NestedPushedEvent
  | NestedReplacedEvent
  | PoppedEvent
  | PushedEvent
  | ReplacedEvent;

export * from "./ActivityRegisteredEvent";
export * from "./InitializedEvent";
export * from "./NestedPoppedEvent";
export * from "./NestedPushedEvent";
export * from "./NestedReplacedEvent";
export * from "./PoppedEvent";
export * from "./PushedEvent";
export * from "./ReplacedEvent";
