import type {
  PausedEvent,
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  ResumedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "./event-types";

/**
 * The six navigation events — a subset union of the existing domain event
 * types (no new vocabulary is introduced).
 */
export type NavigationEvent =
  | PushedEvent
  | ReplacedEvent
  | PoppedEvent
  | StepPushedEvent
  | StepReplacedEvent
  | StepPoppedEvent;

/**
 * The events a snapshot carries: every domain event except the static ones
 * (`Initialized`, `ActivityRegistered`). Statics are config/source-grade
 * information — they may legitimately differ after a reload, so the current
 * config re-derives them at load time instead of trusting the snapshot.
 * Everything the stack recorded at runtime, `Paused`/`Resumed` included, is
 * exported as-is.
 */
export type SnapshotEvent = NavigationEvent | PausedEvent | ResumedEvent;

/**
 * A plain-data value whose structure is owned by core. Encoding to a
 * persistence medium (codec) is the consumer's responsibility.
 */
export type StackSnapshot = {
  /**
   * Structural discriminator tag. A mismatch fails the load as
   * `SnapshotLoadError` — version migration is a non-goal.
   */
  $schema: "stackflow.snapshot.v1";

  /**
   * The event log as recorded (normalized to replay order), minus the static
   * events the current config re-derives at load time. Whether to capture a
   * paused stack is the caller's choice — core exports the stack it is asked
   * about, pause state and all.
   */
  events: SnapshotEvent[];
};
