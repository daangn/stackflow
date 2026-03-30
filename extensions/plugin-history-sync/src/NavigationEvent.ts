import type {
  DomainEvent,
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "@stackflow/core";

export type ActivityNavigationEvent = PushedEvent | PoppedEvent | ReplacedEvent;

export type StepNavigationEvent =
  | StepPushedEvent
  | StepPoppedEvent
  | StepReplacedEvent;

export type NavigationEvent = ActivityNavigationEvent | StepNavigationEvent;

export function isActivityNavigationEvent(
  event: DomainEvent,
): event is ActivityNavigationEvent {
  return (
    event.name === "Pushed" ||
    event.name === "Popped" ||
    event.name === "Replaced"
  );
}

export function isStepNavigationEvent(
  event: DomainEvent,
): event is StepNavigationEvent {
  return (
    event.name === "StepPushed" ||
    event.name === "StepPopped" ||
    event.name === "StepReplaced"
  );
}

export function isNavigationEvent(
  event: DomainEvent,
): event is NavigationEvent {
  return isActivityNavigationEvent(event) || isStepNavigationEvent(event);
}
