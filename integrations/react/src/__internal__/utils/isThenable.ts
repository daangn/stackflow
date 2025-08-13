export interface Thenable<T> {
  then<R>(
    onFulfilled?: (value: T) => R,
    onRejected?: (reason: unknown) => R,
  ): Thenable<Awaited<R>>;
}

export function isThenable(value: unknown): value is Thenable<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof value.then === "function"
  );
}
