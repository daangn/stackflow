/**
 * Why a snapshot load failed, in three kinds:
 * - `incompatible-schema`: the value is not a core-known v1 snapshot structure
 *   (`$schema` mismatch, `events` not an array, an item that is not one of the
 *   six navigation events, or a missing `id`/`name`).
 * - `invalid-events`: the structure is valid but the event sequence is not
 *   valid against the current config (e.g. an event that materializes an
 *   unregistered activity).
 * - `empty-navigation`: replay succeeded but no activity is in an enter state.
 */
export type SnapshotLoadErrorCause =
  | { kind: "incompatible-schema" }
  | { kind: "invalid-events"; detail: unknown }
  | { kind: "empty-navigation" };

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
