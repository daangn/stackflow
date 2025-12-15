import { inspect, liftValue, PromiseStatus } from "./SyncInspectablePromise";

export function useThenable<T>(thenable: PromiseLike<T>): Awaited<T> {
  const syncInspectable = liftValue(thenable);
  const state = inspect(syncInspectable);

  if (state.status === PromiseStatus.FULFILLED) {
    return state.value;
  } else if (state.status === PromiseStatus.REJECTED) {
    throw state.reason;
  }

  throw syncInspectable; // Trigger suspense by throwing the promise.
}
