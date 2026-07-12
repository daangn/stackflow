import type { DomainEvent, StackSnapshot } from "@stackflow/core";
import { makeEvent } from "@stackflow/core";
import type { StackSnapshotRecord } from "@stackflow/plugin-stack-persistence";

/**
 * Base instant for fixture events — 100 seconds before `FIXED_NOW`, so
 * every fixture-dated transition is already settled when a store is
 * created under the pinned clock. This module stays free of vitest
 * imports so isolated subprocess fixtures can bundle it.
 */
export const EVENT_BASE = 1_700_000_000_000;

/** The `Initialized` fixture event's transitionDuration. */
export const TRANSITION_DURATION = 300;

export const HOME_ACTIVITY = "Home";
export const ARTICLE_ACTIVITY = "Article";

/** Recursively freezes a fixture so any mutation attempt throws. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }

  return value;
}

function staticEvents(): DomainEvent[] {
  return [
    makeEvent("Initialized", {
      id: "static-initialized",
      transitionDuration: TRANSITION_DURATION,
      eventDate: EVENT_BASE,
    }),
    makeEvent("ActivityRegistered", {
      id: "static-registered-home",
      activityName: HOME_ACTIVITY,
      eventDate: EVENT_BASE + 1,
    }),
    makeEvent("ActivityRegistered", {
      id: "static-registered-article",
      activityName: ARTICLE_ACTIVITY,
      eventDate: EVENT_BASE + 2,
    }),
  ];
}

/**
 * Create seed: registered `Home`/`Article`, fixed transition duration, and
 * a settled initial `Home` entry.
 */
export function freshEvents(): DomainEvent[] {
  return [
    ...staticEvents(),
    makeEvent("Pushed", {
      id: "fresh-push-home",
      activityId: "fresh-home-1",
      activityName: HOME_ACTIVITY,
      activityParams: { greeting: "hello" },
      eventDate: EVENT_BASE + 10,
    }),
  ];
}

/** Create seed with `Home` and `Article` already settled (for pop cases). */
export function twoActivityEvents(): DomainEvent[] {
  return [
    ...freshEvents(),
    makeEvent("Pushed", {
      id: "prep-push-article",
      activityId: "prep-article-1",
      activityName: ARTICLE_ACTIVITY,
      activityParams: { articleId: "prep-a-1" },
      eventDate: EVENT_BASE + 20,
    }),
  ];
}

/**
 * Create seed with one extra settled step on `Home` (for stepReplace /
 * stepPop cases, so the action changes observable state).
 */
export function withStepEvents(): DomainEvent[] {
  return [
    ...freshEvents(),
    makeEvent("StepPushed", {
      id: "prep-step-push",
      stepId: "prep-home-step-2",
      stepParams: { page: "2" },
      eventDate: EVENT_BASE + 20,
    }),
  ];
}

/**
 * `Home(params) → Article(params)` with a step push/push/replace/pop
 * history inside `Article`: final state is an unpaused idle stack whose
 * current step is `page: "2"`, with the full step history still in the
 * event log.
 */
export function richSnapshot(): StackSnapshot {
  return deepFreeze({
    $schema: "stackflow.snapshot.v1",
    events: [
      makeEvent("Pushed", {
        id: "rich-push-home",
        activityId: "rich-home-1",
        activityName: HOME_ACTIVITY,
        activityParams: { greeting: "hello" },
        eventDate: EVENT_BASE + 10,
      }),
      makeEvent("Pushed", {
        id: "rich-push-article",
        activityId: "rich-article-1",
        activityName: ARTICLE_ACTIVITY,
        activityParams: { articleId: "a-1" },
        eventDate: EVENT_BASE + 20,
      }),
      makeEvent("StepPushed", {
        id: "rich-step-push-2",
        stepId: "rich-article-step-2",
        stepParams: { page: "2" },
        eventDate: EVENT_BASE + 30,
      }),
      makeEvent("StepPushed", {
        id: "rich-step-push-3",
        stepId: "rich-article-step-3",
        stepParams: { page: "3" },
        eventDate: EVENT_BASE + 40,
      }),
      makeEvent("StepReplaced", {
        id: "rich-step-replace-3",
        stepId: "rich-article-step-3r",
        stepParams: { page: "3-revised" },
        eventDate: EVENT_BASE + 50,
      }),
      makeEvent("StepPopped", {
        id: "rich-step-pop",
        eventDate: EVENT_BASE + 60,
      }),
    ],
  });
}

/** Snapshot whose last event is `Paused`, so core restores a paused stack. */
export function pausedSnapshot(): StackSnapshot {
  return deepFreeze({
    $schema: "stackflow.snapshot.v1",
    events: [
      makeEvent("Pushed", {
        id: "paused-push-home",
        activityId: "paused-home-1",
        activityName: HOME_ACTIVITY,
        activityParams: { greeting: "hello" },
        eventDate: EVENT_BASE + 10,
      }),
      makeEvent("Paused", {
        id: "paused-pause",
        eventDate: EVENT_BASE + 20,
      }),
    ],
  });
}

/**
 * Fails core's structural validation (`$schema` mismatch). The cast is the
 * point: this simulates a corrupt record coming back from a storage.
 */
export function invalidSchemaSnapshot(): StackSnapshot {
  return deepFreeze({
    $schema: "stackflow.snapshot.v0",
    events: [
      makeEvent("Pushed", {
        id: "invalid-push-home",
        activityId: "invalid-home-1",
        activityName: HOME_ACTIVITY,
        activityParams: {},
        eventDate: EVENT_BASE + 10,
      }),
    ],
  }) as unknown as StackSnapshot;
}

/**
 * Structurally valid, but materializes an activity that the current config
 * does not register — fails core's compatibility validation.
 */
export function unregisteredActivitySnapshot(): StackSnapshot {
  return deepFreeze({
    $schema: "stackflow.snapshot.v1",
    events: [
      makeEvent("Pushed", {
        id: "unregistered-push-ghost",
        activityId: "unregistered-ghost-1",
        activityName: "Ghost",
        activityParams: {},
        eventDate: EVENT_BASE + 10,
      }),
    ],
  });
}

/** Builds a frozen record with an explicit own `metadata` property. */
export function makeRecord<Metadata = undefined>(
  snapshot: StackSnapshot,
  metadata: Metadata,
): StackSnapshotRecord<Metadata> {
  return deepFreeze({ snapshot, metadata });
}
