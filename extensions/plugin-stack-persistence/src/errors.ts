/**
 * Expected load failures raised by the injected storage (`load()` threw).
 * Core snapshot-validation failures are NOT wrapped in this class — core's
 * own `SnapshotLoadError` is passed through with its identity preserved.
 * Unexpected failures (a strategy predicate that throws, plugin defects, a
 * storage that throws synchronously from `save`) are not normalized into
 * these classes either. Error objects never carry the failed record.
 */
export type StackPersistenceLoadErrorCause =
  | { kind: "storage"; detail: unknown }
  | { kind: "strategy"; detail: unknown };

export class StackPersistenceLoadError extends Error {
  cause: StackPersistenceLoadErrorCause;

  constructor(cause: StackPersistenceLoadErrorCause, message?: string) {
    super(message ?? `failed to load stack snapshot record: ${cause.kind}`);
    this.name = "StackPersistenceLoadError";
    this.cause = cause;
  }
}

/**
 * Expected save failures: the strategy's `createMetadata` threw (the whole
 * record save is abandoned atomically) or the storage's save promise
 * rejected. Reported per failed request via `onSaveError`; never cancels
 * navigation.
 */
export type StackPersistenceSaveErrorCause =
  | { kind: "strategy"; detail: unknown }
  | { kind: "storage"; detail: unknown };

export class StackPersistenceSaveError extends Error {
  cause: StackPersistenceSaveErrorCause;

  constructor(cause: StackPersistenceSaveErrorCause, message?: string) {
    super(message ?? `failed to save stack snapshot record: ${cause.kind}`);
    this.name = "StackPersistenceSaveError";
    this.cause = cause;
  }
}
