import { useEffect, useRef } from "react";

import { useActivity } from "../../__internal__/activity/useActivity";
import { runSafely } from "./runSafely";
import { useLifecycleStore } from "./lifecyclePlugin";

export function useFocusEffect(
  callback: () => (() => void) | void,
): void {
  const store = useLifecycleStore();
  const activity = useActivity();
  const idRef = useRef<symbol>(Symbol());
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const id = idRef.current;

    store.entries.set(id, {
      id,
      activityId: activity.id,
      callbackRef,
    });

    // Initial focus: if activity is already active, run effect immediately.
    // activity.isActive is intentionally not in deps — onChanged handles subsequent transitions.
    if (activity.isActive) {
      const cleanup = runSafely(callbackRef.current);
      store.cleanups.set(id, cleanup);
    }

    return () => {
      const cleanup = store.cleanups.get(id);
      runSafely(cleanup);
      store.cleanups.delete(id);
      store.entries.delete(id);
    };
  }, [store, activity.id]);
}
