import React from "react";

const PROMISE_STATUS = Symbol("PROMISE_STATUS");
const PROMISE_VALUE = Symbol("PROMISE_VALUE");
const PROMISE_REASON = Symbol("PROMISE_REASON");

type PromiseStatus = "pending" | "fulfilled" | "rejected";

interface TrackedPromise<T> extends Promise<T> {
  [PROMISE_STATUS]?: PromiseStatus;
  [PROMISE_VALUE]?: T;
  [PROMISE_REASON]?: unknown;
}

/**
 * Shim for React.use() that works with React 18 and below.
 *
 * This function tracks promise state using symbol properties and throws
 * the promise to trigger Suspense when pending.
 *
 * @see https://github.com/facebook/react/pull/25084
 */
function useShim<T>(usable: Promise<T> | React.Context<T>): T {
  // Handle Context
  if (
    usable !== null &&
    typeof usable === "object" &&
    "Provider" in usable &&
    "_currentValue" in usable
  ) {
    return (usable as unknown as { _currentValue: T })._currentValue;
  }

  // Handle Promise
  const promise = usable as TrackedPromise<T>;

  switch (promise[PROMISE_STATUS]) {
    case "fulfilled":
      return promise[PROMISE_VALUE] as T;
    case "rejected":
      throw promise[PROMISE_REASON];
    case "pending":
      throw promise;
    default: {
      promise[PROMISE_STATUS] = "pending";
      throw promise.then(
        (value) => {
          promise[PROMISE_STATUS] = "fulfilled";
          promise[PROMISE_VALUE] = value;
        },
        (reason) => {
          promise[PROMISE_STATUS] = "rejected";
          promise[PROMISE_REASON] = reason;
        },
      );
    }
  }
}

export const use: typeof React.use = React.use ?? useShim;
