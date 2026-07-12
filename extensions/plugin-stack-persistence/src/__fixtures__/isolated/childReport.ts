/**
 * Shared shape and helpers for isolated child fixtures. Each child prints
 * exactly one JSON line as its last stdout output; the parent spec asserts
 * on the parsed report.
 */
export type CapturedAsyncError = {
  isError: boolean;
  errorName: string | null;
  causeKind: string | null;
  causeDetail: unknown;
  /** Whether the value is an instance of the package's save error class. */
  isStackPersistenceSaveError: boolean;
};

export function describeAsyncError(
  value: unknown,
  saveErrorClass: abstract new (...args: never[]) => Error,
): CapturedAsyncError {
  const error = value as {
    name?: unknown;
    cause?: { kind?: unknown; detail?: unknown };
  };

  return {
    isError: value instanceof Error,
    errorName: typeof error?.name === "string" ? error.name : null,
    causeKind: typeof error?.cause?.kind === "string" ? error.cause.kind : null,
    causeDetail: error?.cause?.detail ?? null,
    isStackPersistenceSaveError: value instanceof saveErrorClass,
  };
}

/** Yields the given number of macrotask turns to the event loop. */
export async function yieldTurns(turns: number): Promise<void> {
  for (let i = 0; i < turns; i += 1) {
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
}

export async function waitUntil(
  condition: () => boolean,
  description: string,
  maxTurns = 200,
): Promise<void> {
  for (let i = 0; i < maxTurns; i += 1) {
    if (condition()) {
      return;
    }
    await yieldTurns(1);
  }

  throw new Error(`condition was never met in child process: ${description}`);
}

export function printReport(report: Record<string, unknown>): void {
  process.stdout.write(`\n${JSON.stringify(report)}\n`);
}
