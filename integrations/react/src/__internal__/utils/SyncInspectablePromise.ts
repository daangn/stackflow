export type SyncInspectablePromise<T> = Promise<T> & PromiseState<T>;

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

export const PromiseStatus = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
} as const;
export type PromiseStatus = (typeof PromiseStatus)[keyof typeof PromiseStatus];

export function makeSyncInspectable<T>(
  promise: Promise<T>,
): SyncInspectablePromise<T> {
  const syncInspectablePromise: SyncInspectablePromise<T> = Object.assign(
    new Promise<T>((resolve) => resolve(promise)),
    {
      status: PromiseStatus.PENDING,
    },
  );

  syncInspectablePromise.then(
    (value) => {
      Object.assign(syncInspectablePromise, {
        status: PromiseStatus.FULFILLED,
        value,
      });
    },
    (reason) => {
      Object.assign(syncInspectablePromise, {
        status: PromiseStatus.REJECTED,
        reason,
      });
    },
  );

  return syncInspectablePromise;
}
