import { useActivity } from "@stackflow/react";
import { useEffect, useRef } from "react";
import { runSafely } from "./runSafely";
import { useLifecycleStore } from "./lifecyclePlugin";

/**
 * Registers a callback that runs when the activity gains focus (becomes active)
 * and an optional cleanup that runs on blur (loses active status) or unmount.
 *
 * The callback is invoked from the plugin's `onChanged` handler — outside the
 * React render cycle — so it executes immediately on activity transition without
 * waiting for React's deferred rendering.
 *
 * Best for external side-effects: query invalidation, analytics, cache warming.
 * Avoid calling React setState inside the callback — the React tree may still
 * reflect the previous stack state at invocation time.
 *
 * For effects that depend on a settled React tree (DOM manipulation, scroll
 * restoration), use `useActiveEffect` from `@stackflow/react` instead.
 */
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
