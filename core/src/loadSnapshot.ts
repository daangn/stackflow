import { aggregate } from "./aggregate";
import type { DomainEvent } from "./event-types";
import { isSnapshotEventName } from "./event-utils";
import { SnapshotLoadError } from "./SnapshotLoadError";
import type { Stack } from "./Stack";
import type { SnapshotEvent, StackSnapshot } from "./StackSnapshot";

/**
 * Reconstruct a stack from a provided snapshot by replaying its events
 * through the existing aggregate machinery. The snapshot's events replay
 * as-is — their recorded `eventDate`s are the replay truth (replay order
 * follows the dates), so a stack captured mid-transition restores
 * mid-transition and a paused stack restores paused. Core imposes no
 * settling or normalization on the replay; a plugin that wants a stronger
 * guarantee (e.g. a fully-settled restore) re-dates the sequence in
 * `overrideInitialEvents`. Static information (transitionDuration, the
 * registered-activity set) is re-derived from the current config's static
 * events, never from the snapshot; only those static events are re-dated
 * (see `backdateStaticEvents`).
 *
 * `overrideSnapshotEvents` is the plugins' `overrideInitialEvents` chain:
 * its return is adopted as the replay sequence. It runs after the structure
 * check (hooks never see an unrecognizable value) and before every other
 * step, so validation applies to the sequence that actually replays —
 * whether it came straight from the snapshot or was reshaped by a plugin.
 * An error thrown by the chain itself is a plugin bug, not a snapshot
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

  const events: DomainEvent[] = [
    ...backdateStaticEvents(staticEvents, snapshotEvents),
    ...snapshotEvents,
  ];

  let stack: Stack;
  try {
    stack = aggregate(events, Date.now());
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
 * Date the static events to strictly increasing values just before the
 * earliest replayed event, preserving their relative order. Statics must
 * apply first: `Initialized` seeds `transitionDuration` for every later
 * reducer step, and a snapshot whose tail is an unresumed `Paused` would
 * quarantine statics sorted after it. Their natural dates cannot be trusted
 * for that ordering — the current config's statics are dated "now", which
 * falls after a past-dated snapshot — so they are pinned relative to the
 * replay sequence instead of the clock. The replayed events themselves are
 * never re-dated.
 */
function backdateStaticEvents(
  staticEvents: DomainEvent[],
  snapshotEvents: SnapshotEvent[],
): DomainEvent[] {
  if (snapshotEvents.length === 0) {
    return staticEvents;
  }

  const earliestReplayDate = snapshotEvents.reduce(
    (earliest, event) => Math.min(earliest, event.eventDate),
    Number.POSITIVE_INFINITY,
  );

  return staticEvents.map((event, index) => ({
    ...event,
    eventDate: earliestReplayDate - (staticEvents.length - index),
  }));
}
