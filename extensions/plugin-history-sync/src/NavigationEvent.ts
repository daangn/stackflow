import type {
  DomainEvent,
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "@stackflow/core";

export type NavigationEvent =
  | PushedEvent
  | PoppedEvent
  | ReplacedEvent
  | StepPushedEvent
  | StepPoppedEvent
  | StepReplacedEvent;

export function isNavigationEvent(
  event: DomainEvent,
): event is NavigationEvent {
  return (
    event.name === "Pushed" ||
    event.name === "Popped" ||
    event.name === "Replaced" ||
    event.name === "StepPushed" ||
    event.name === "StepPopped" ||
    event.name === "StepReplaced"
  );
}
