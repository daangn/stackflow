import type { ActivityRegisteredEvent } from "./ActivityRegisteredEvent";
import type { InitializedEvent } from "./InitializedEvent";
import type { PausedEvent } from "./PausedEvent";
import type { PoppedEvent } from "./PoppedEvent";
import type { PushedEvent } from "./PushedEvent";
import type { ReplacedEvent } from "./ReplacedEvent";
import type { ResumedEvent } from "./ResumedEvent";
import type { StepPoppedEvent } from "./StepPoppedEvent";
import type { StepPushedEvent } from "./StepPushedEvent";
import type { StepReplacedEvent } from "./StepReplacedEvent";

export type DomainEvent =
  | ActivityRegisteredEvent
  | InitializedEvent
  | StepPoppedEvent
  | StepPushedEvent
  | StepReplacedEvent
  | PoppedEvent
  | PushedEvent
  | ReplacedEvent
  | PausedEvent
  | ResumedEvent;

export * from "./ActivityRegisteredEvent";
export * from "./InitializedEvent";
export * from "./PoppedEvent";
export * from "./PushedEvent";
export * from "./ReplacedEvent";
export * from "./StepPoppedEvent";
export * from "./StepPushedEvent";
export * from "./StepReplacedEvent";
export * from "./PausedEvent";
export * from "./ResumedEvent";
