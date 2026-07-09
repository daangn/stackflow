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
 * `overrideNavigationEvents` is the plugins' `overrideInitialEvents` chain:
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
  overrideNavigationEvents?: (events: NavigationEvent[]) => NavigationEvent[],
): { events: DomainEvent[]; stack: Stack } {
  assertSnapshotStructure(snapshot);

  const navigationEvents =
    overrideNavigationEvents?.(snapshot.events) ?? snapshot.events;

  const transitionDuration =
    filterEvents(staticEvents, "Initialized")[0]?.transitionDuration ?? 0;

  const now = Date.now();
  const rebasedEvents = rebaseNavigationEvents(navigationEvents, {
    now,
    transitionDuration,
    latestStaticEventDate: staticEvents.reduce(
      (latest, event) => Math.max(latest, event.eventDate),
      Number.NEGATIVE_INFINITY,
    ),
  });

  const events = [...staticEvents, ...rebasedEvents];

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
      !isNavigationEventName((event as { name?: unknown }).name)
    ) {
      throw new SnapshotLoadError({
        kind: "unrecognized-snapshot",
        detail: `event item at index ${index} is not a navigation event`,
      });
    }
  }
}

/**
 * Re-date snapshot events so replay settles deterministically (RB1–RB5):
 * assign strictly increasing dates in array order (array order is the replay
 * order), placed inside the window after the static events and far enough in
 * the past (`≤ now − transitionDuration`) that every reducer folds to a
 * settled state. Fractional spacing fits any number of events inside the
 * window, so snapshot events fold after the static events regardless of
 * history length. Every other field is preserved byte-for-byte
 * (id/activityId/stepId included). Basing the new dates on capture order
 * rather than the original values keeps a clock skew between the capture and
 * load sessions from disturbing intra-snapshot order, and makes post-load
 * navigation (dispatched at the current time) always sort after the restored
 * events.
 */
function rebaseNavigationEvents(
  events: NavigationEvent[],
  context: {
    now: number;
    transitionDuration: number;
    latestStaticEventDate: number;
  },
): NavigationEvent[] {
  const settledUpperBound = context.now - context.transitionDuration;
  const window = settledUpperBound - context.latestStaticEventDate;
  // A degenerate window (static events dated at or past the settled bound —
  // e.g. a direct core embedding dating them near creation time) falls back
  // to settledness alone: fold semantics are safe without the placement.
  const spacing = window > 0 ? Math.min(1, window / (events.length + 1)) : 1;

  return events.map((event, index) => ({
    ...event,
    eventDate: settledUpperBound - (events.length - index) * spacing,
  }));
}
