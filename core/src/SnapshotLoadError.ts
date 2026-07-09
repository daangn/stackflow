/**
 * Why a snapshot load failed, in three kinds that read as the
 * snapshot → events → stack pipeline:
 * - `unrecognized-snapshot`: the value is not a snapshot structure core
 *   recognizes — a catch-all over the structural checks (`$schema` mismatch,
 *   `events` not being an array, or an item that is not one of the six
 *   navigation events, including a missing `id`/`name`). `detail` names the
 *   check that failed.
 * - `incompatible-events`: the structure is recognized but the event sequence
 *   is incompatible with the current config (e.g. it materializes an
 *   unregistered activity) — a relational failure against the config, not a
 *   defect intrinsic to the events.
 * - `empty-stack`: replay succeeded but left zero activities in an enter
 *   state, so there is nothing to show. Note the condition is "zero
 *   enter-state activities", not an empty `activities` array — exit-done
 *   activities may remain.
 */
export type SnapshotLoadErrorCause =
  | { kind: "unrecognized-snapshot"; detail: string }
  | { kind: "incompatible-events"; detail: unknown }
  | { kind: "empty-stack" };

/**
 * Thrown when loading a provided snapshot fails. Routed to the providing
 * plugin's `onLoadError` first (R5); if unrecovered, thrown out of
 * `makeCoreStore` (R4).
 */
export class SnapshotLoadError extends Error {
  cause: SnapshotLoadErrorCause;

  constructor(cause: SnapshotLoadErrorCause, message?: string) {
    super(message ?? `failed to load snapshot: ${cause.kind}`);
    this.name = "SnapshotLoadError";
    this.cause = cause;

    // Restore the prototype chain so `instanceof` holds after down-level
    // transpilation of a built-in subclass.
    Object.setPrototypeOf(this, SnapshotLoadError.prototype);
  }
}
