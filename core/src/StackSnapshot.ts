import type {
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "./event-types";

/**
 * The six navigation events — a subset union of the existing domain event
 * types (no new vocabulary is introduced). A snapshot carries only these.
 */
export type NavigationEvent =
  | PushedEvent
  | ReplacedEvent
  | PoppedEvent
  | StepPushedEvent
  | StepReplacedEvent
  | StepPoppedEvent;

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
   * Navigation events only. `Initialized` and `ActivityRegistered` are not
   * carried — the current config re-derives them at load time. `Paused` and
   * `Resumed` are not carried either — they are discarded as transition and
   * pause information.
   */
  events: NavigationEvent[];
};
