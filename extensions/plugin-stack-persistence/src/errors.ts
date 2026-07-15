/**
 * Expected save failures raised when the storage's save promise rejects.
 * Reported per failed request via `onSaveError`; never cancels navigation.
 * Strategy metadata failures are unexpected and surface as their original
 * values instead of being wrapped in this class.
 */
export type StackPersistenceSaveErrorCause = { detail: unknown };

export class StackPersistenceSaveError extends Error {
  cause: StackPersistenceSaveErrorCause;

  constructor(cause: StackPersistenceSaveErrorCause, message?: string) {
    super(message ?? "failed to save stack snapshot record");
    this.name = "StackPersistenceSaveError";
    this.cause = cause;
  }
}
