import { aggregate } from "./aggregate";
import type { DomainEvent } from "./event-types";
import { filterEvents, isNavigationEventName } from "./event-utils";
import { SnapshotLoadError } from "./SnapshotLoadError";
import type { Stack } from "./Stack";
import type { NavigationEvent, StackSnapshot } from "./StackSnapshot";

/**
 * Reconstruct a stack from a provided snapshot by replaying its navigation
 * events through the existing aggregate machinery. Static information
 * (transitionDuration, the registered-activity set) is re-derived from the
 * current config's static events, never from the snapshot.
 *
 * The four checks a snapshot must pass, each mapped to a `SnapshotLoadError`
 * cause:
 * - structure → `incompatible-schema`
 * - registration (every activity-introducing event's name is registered now) →
 *   `invalid-events`
 * - replay validity (existing `validateEvents`) → `invalid-events`
 * - postcondition (at least one activity ends in an enter state) →
 *   `empty-navigation`
 *
 * On success it returns the replay event log (static events followed by the
 * rebased snapshot events) and the settled stack.
 */
export function loadSnapshot(
  snapshot: StackSnapshot,
  staticEvents: DomainEvent[],
): { events: DomainEvent[]; stack: Stack } {
  assertSnapshotStructure(snapshot);

  const registeredActivityNames = new Set(
    filterEvents(staticEvents, "ActivityRegistered").map(
      (event) => event.activityName,
    ),
  );

  // Registration check (L6). The current config is the source of truth for
  // which activities exist. Unlike the runtime `validateEvents` — which checks
  // only Pushed — this also covers Replaced, since Replaced materializes an
  // activity by name too. An unregistered name here means the config changed
  // out from under a stale snapshot: fail loudly rather than resurrect it.
  for (const event of snapshot.events) {
    if (
      (event.name === "Pushed" || event.name === "Replaced") &&
      !registeredActivityNames.has(event.activityName)
    ) {
      throw new SnapshotLoadError({
        kind: "invalid-events",
        detail: `activity "${event.activityName}" is not registered in the current config`,
      });
    }
  }

  const transitionDuration =
    filterEvents(staticEvents, "Initialized")[0]?.transitionDuration ?? 0;

  const now = Date.now();
  const rebasedEvents = rebaseNavigationEvents(snapshot.events, {
    now,
    transitionDuration,
  });

  const events = [...staticEvents, ...rebasedEvents];

  let stack: Stack;
  try {
    stack = aggregate(events, now);
  } catch (error) {
    // A structurally-valid event sequence that the replay machinery rejects
    // (e.g. `validateEvents`) is an invalid-events failure, not a crash.
    throw new SnapshotLoadError({
      kind: "invalid-events",
      detail: error instanceof Error ? error.message : error,
    });
  }

  const hasEnteredActivity = stack.activities.some(
    (activity) =>
      activity.transitionState === "enter-active" ||
      activity.transitionState === "enter-done",
  );

  if (!hasEnteredActivity) {
    // Replay succeeded but left no visible activity (empty events, or a history
    // that pops everything). A blank screen is a silent failure — surface it.
    throw new SnapshotLoadError({ kind: "empty-navigation" });
  }

  return { events, stack };
}

/**
 * Verify the value is a core-known v1 snapshot before any replay: the schema
 * tag matches, `events` is an array, and every item is a navigation event
 * carrying an `id` and `name`. Anything else is `incompatible-schema`.
 */
function assertSnapshotStructure(snapshot: StackSnapshot): void {
  if (snapshot?.$schema !== "stackflow.snapshot.v1") {
    throw new SnapshotLoadError({ kind: "incompatible-schema" });
  }

  const events: unknown = snapshot.events;

  if (!Array.isArray(events)) {
    throw new SnapshotLoadError({ kind: "incompatible-schema" });
  }

  for (const event of events) {
    if (
      !event ||
      typeof event !== "object" ||
      typeof (event as { id?: unknown }).id !== "string" ||
      !isNavigationEventName((event as { name?: unknown }).name)
    ) {
      throw new SnapshotLoadError({ kind: "incompatible-schema" });
    }
  }
}

/**
 * Re-date snapshot events so replay settles deterministically (RB1–RB5):
 * assign strictly increasing dates in array order (array order is the replay
 * order), all far enough in the past (`≤ now − transitionDuration`) that every
 * reducer folds to a settled state, while preserving every other field
 * byte-for-byte (id/activityId/stepId included). Basing the new dates on
 * capture order rather than the original values keeps a clock skew between the
 * capture and load sessions from disturbing intra-snapshot order, and makes
 * post-load navigation (dispatched at the current time) always sort after the
 * restored events.
 */
function rebaseNavigationEvents(
  events: NavigationEvent[],
  context: { now: number; transitionDuration: number },
): NavigationEvent[] {
  const settledUpperBound = context.now - context.transitionDuration;

  return events.map((event, index) => ({
    ...event,
    eventDate: settledUpperBound - (events.length - index),
  }));
}
