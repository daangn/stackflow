export class StackSnapshotRecordSaveError extends Error {
  cause: unknown;

  constructor(cause: unknown, message?: string) {
    super(message ?? "failed to save stack snapshot record");
    this.name = "StackPersistenceSaveError";
    this.cause = cause;
  }
}
