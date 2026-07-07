import type { DomainEvent } from "../event-types";
import type { NavigationEvent } from "../StackSnapshot";

/**
 * The six navigation events a snapshot carries. Single source of truth for the
 * capture-side filter and the load-side structure check.
 */
const NAVIGATION_EVENT_NAMES: ReadonlySet<DomainEvent["name"]> = new Set([
  "Pushed",
  "Replaced",
  "Popped",
  "StepPushed",
  "StepReplaced",
  "StepPopped",
]);

/** Whether an event is one of the six navigation events. */
export function isNavigationEvent(
  event: DomainEvent,
): event is NavigationEvent {
  return NAVIGATION_EVENT_NAMES.has(event.name);
}

/** Whether a value is one of the six navigation event names. */
export function isNavigationEventName(name: unknown): boolean {
  return (
    typeof name === "string" &&
    NAVIGATION_EVENT_NAMES.has(name as DomainEvent["name"])
  );
}
