import type { DomainEvent } from "../event-types";
import type { SnapshotEvent } from "../StackSnapshot";

/**
 * The events a snapshot carries — every domain event except the static ones
 * (`Initialized`, `ActivityRegistered`), which the current config re-derives
 * at load time. Single source of truth for the capture-side filter and the
 * load-side structure check.
 *
 * Its members are constrained to `SnapshotEvent["name"]` at construction (a
 * typo or a non-snapshot name fails to compile), but the set itself is typed
 * `ReadonlySet<string>` so both membership checks below can pass a plain event
 * name — a `DomainEvent["name"]` or a runtime `string` — without a cast.
 */
const SNAPSHOT_EVENT_NAMES: ReadonlySet<string> = new Set<SnapshotEvent["name"]>(
  [
    "Pushed",
    "Replaced",
    "Popped",
    "StepPushed",
    "StepReplaced",
    "StepPopped",
    "Paused",
    "Resumed",
  ],
);

/** Whether an event is one a snapshot carries (i.e. not a static event). */
export function isSnapshotEvent(event: DomainEvent): event is SnapshotEvent {
  return SNAPSHOT_EVENT_NAMES.has(event.name);
}

/** Whether a value is the name of an event a snapshot carries. */
export function isSnapshotEventName(name: unknown): boolean {
  return typeof name === "string" && SNAPSHOT_EVENT_NAMES.has(name);
}
