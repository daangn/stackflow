import { isPromiseLike } from "./isPromiseLike";

export interface SyncInspectablePromise<T> extends Promise<T> {
  status: PromiseStatus;
  value?: T;
  reason?: unknown;
}

export const PromiseStatus = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
} as const;
export type PromiseStatus = (typeof PromiseStatus)[keyof typeof PromiseStatus];

export type PromiseState<T> =
  | {
      status: typeof PromiseStatus.PENDING;
    }
  | {
      status: typeof PromiseStatus.FULFILLED;
      value: T;
    }
  | {
      status: typeof PromiseStatus.REJECTED;
      reason: unknown;
    };

export function inspect<T>(
  promise: SyncInspectablePromise<T>,
): PromiseState<T> {
  if (promise.status === PromiseStatus.PENDING) {
    return {
      status: PromiseStatus.PENDING,
    };
  } else if (promise.status === PromiseStatus.FULFILLED && "value" in promise) {
    return {
      status: PromiseStatus.FULFILLED,
      value: promise.value as T,
    };
  } else if (promise.status === PromiseStatus.REJECTED && "reason" in promise) {
    return {
      status: PromiseStatus.REJECTED,
      reason: promise.reason,
    };
  } else {
    throw new Error("Invalid promise state");
  }
}

function makeSyncInspectable<T>(
  promise: Promise<T>,
): SyncInspectablePromise<T> {
  if (
    "status" in promise &&
    Object.values(PromiseStatus).some((status) => status === promise.status)
  ) {
    return promise as SyncInspectablePromise<T>;
  }

  const syncInspectablePromise: SyncInspectablePromise<T> = Object.assign(
    promise,
    { status: PromiseStatus.PENDING },
  );

  syncInspectablePromise.then(
    (value) => {
      syncInspectablePromise.status = PromiseStatus.FULFILLED;
      syncInspectablePromise.value = value;
    },
    (reason) => {
      syncInspectablePromise.status = PromiseStatus.REJECTED;
      syncInspectablePromise.reason = reason;
    },
  );

  return syncInspectablePromise;
}

export function resolve<T>(value: T): SyncInspectablePromise<Awaited<T>> {
  if (isPromiseLike(value)) {
    return makeSyncInspectable(
      value instanceof Promise ? value : Promise.resolve(value),
    );
  }

  return Object.assign(Promise.resolve(value), {
    status: PromiseStatus.FULFILLED,
    value,
  }) as SyncInspectablePromise<Awaited<T>>;
}

export function reject(error: unknown): SyncInspectablePromise<never> {
  return Object.assign(Promise.reject(error), {
    status: PromiseStatus.REJECTED,
    reason: error,
  }) as SyncInspectablePromise<never>;
}
