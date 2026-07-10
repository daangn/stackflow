import { aggregate } from "./aggregate";
import type { DomainEvent } from "./event-types";
import { filterEvents, isSnapshotEventName } from "./event-utils";
import { SnapshotLoadError } from "./SnapshotLoadError";
import type { Stack } from "./Stack";
import type { SnapshotEvent, StackSnapshot } from "./StackSnapshot";

/**
 * Reconstruct a stack from a provided snapshot by replaying its events
 * through the existing aggregate machinery. Static information
 * (transitionDuration, the registered-activity set) is re-derived from the
 * current config's static events, never from the snapshot.
 *
 * `overrideSnapshotEvents` is the plugins' `overrideInitialEvents` chain:
 * its return is adopted as the replay sequence. It runs after the structure
 * check (hooks never see an unrecognizable value) and before every other
 * step, so validation and rebasing apply to the sequence that actually
 * replays — whether it came straight from the snapshot or was reshaped by a
 * plugin. An error thrown by the chain itself is a plugin bug, not a snapshot
 * defect, and propagates raw instead of becoming a `SnapshotLoadError`.
 */
export function loadSnapshot(
  snapshot: StackSnapshot,
  staticEvents: DomainEvent[],
  overrideSnapshotEvents?: (events: SnapshotEvent[]) => SnapshotEvent[],
): { events: DomainEvent[]; stack: Stack } {
  assertSnapshotStructure(snapshot);

  const snapshotEvents =
    overrideSnapshotEvents?.(snapshot.events) ?? snapshot.events;

  const transitionDuration =
    filterEvents(staticEvents, "Initialized")[0]?.transitionDuration ?? 0;

  const now = Date.now();
  const events = rebaseEvents([...staticEvents, ...snapshotEvents], {
    now,
    transitionDuration,
  });

  let stack: Stack;
  try {
    stack = aggregate(events, now);
  } catch (error) {
    // A structurally-valid event sequence that the replay machinery rejects
    // (e.g. `validateEvents`) is an incompatible-events failure, not a crash.
    throw new SnapshotLoadError({
      kind: "incompatible-events",
      detail: error instanceof Error ? error.message : error,
    });
  }

  const hasEnteredActivity = stack.activities.some(
    (activity) =>
      activity.transitionState === "enter-active" ||
      activity.transitionState === "enter-done",
  );

  if (!hasEnteredActivity) {
    // Replay succeeded but left zero enter-state activities (empty events, or
    // a history that pops everything — exit-done activities may remain). A
    // blank screen is a silent failure — surface it.
    throw new SnapshotLoadError({ kind: "empty-stack" });
  }

  return { events, stack };
}

/**
 * A value that is not a core-known v1 snapshot must fail loudly before any
 * replay (`unrecognized-snapshot`) instead of folding into a corrupt stack.
 * `detail` names which structural check failed, for diagnosis.
 */
function assertSnapshotStructure(snapshot: StackSnapshot): void {
  if (snapshot?.$schema !== "stackflow.snapshot.v1") {
    throw new SnapshotLoadError({
      kind: "unrecognized-snapshot",
      detail: "$schema mismatch",
    });
  }

  const events: unknown = snapshot.events;

  if (!Array.isArray(events)) {
    throw new SnapshotLoadError({
      kind: "unrecognized-snapshot",
      detail: "events is not an array",
    });
  }

  for (const [index, event] of events.entries()) {
    if (
      !event ||
      typeof event !== "object" ||
      typeof (event as { id?: unknown }).id !== "string" ||
      !isSnapshotEventName((event as { name?: unknown }).name)
    ) {
      throw new SnapshotLoadError({
        kind: "unrecognized-snapshot",
        detail: `event item at index ${index} is not a snapshot event`,
      });
    }
  }
}

/**
 * Re-date the load events so replay settles deterministically: assign strictly
 * increasing dates in array order (array order is the replay order), every one
 * at or before `now − transitionDuration` so every reducer folds to a settled
 * state. Static events lead the array, so this single backward walk keeps them
 * ahead of the navigation events without dating them specially — static events
 * are navigation-inert (aggregate reads their `eventDate` only as a sort key,
 * and a re-captured snapshot never persists them), so they need only stay
 * ordered before navigation, which the shared re-dating guarantees at any
 * `transitionDuration` (td=0 included, where static and navigation would
 * otherwise share a timestamp). Every other field is preserved byte-for-byte
 * (id/activityId/stepId included). Dating by replay order rather than the
 * original values keeps a capture/load clock skew from disturbing order, and
 * makes post-load navigation (dispatched at the current time) sort after the
 * restored events.
 */
function rebaseEvents(
  events: DomainEvent[],
  context: {
    now: number;
    transitionDuration: number;
  },
): DomainEvent[] {
  const settledUpperBound = context.now - context.transitionDuration;

  return events.map((event, index) => ({
    ...event,
    eventDate: settledUpperBound - (events.length - index),
  }));
}
