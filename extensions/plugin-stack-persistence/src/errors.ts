export class StackSnapshotRecordSaveError extends Error {
  cause: unknown;

  constructor(cause: unknown, message?: string) {
    super(message ?? "failed to save stack snapshot record");
    this.name = "StackSnapshotRecordSaveError";
    this.cause = cause;
  }
}

export class StackSnapshotRecordLoadError extends Error {
  cause: unknown;

  constructor(cause: unknown, message?: string) {
    super(message ?? "failed to load stack snapshot record");
    this.name = "StackSnapshotRecordLoadError";
    this.cause = cause;
  }
}

export class StackSnapshotMetadataParseError extends Error {
  detail?: unknown;

  constructor(detail?: unknown) {
    super("failed to parse stack snapshot metadata");
    this.name = "StackSnapshotMetadataParseError";
    this.detail = detail;
  }
}
