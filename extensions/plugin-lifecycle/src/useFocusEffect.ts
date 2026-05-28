import { useActivity } from "@stackflow/react";
import { useEffect, useRef } from "react";
import { runSafely } from "./runSafely";
import { useLifecycleStore } from "./lifecyclePlugin";

/**
 * Registers a callback that runs when the activity gains focus (becomes active)
 * and an optional cleanup that runs on blur (loses active status), unmount,
 * or when the callback reference changes.
 *
 * Wrap the callback in `React.useCallback` to control when cleanup→re-run occurs:
 *
 * ```tsx
 * useFocusEffect(
 *   useCallback(() => {
 *     const sub = subscribe(articleId);
 *     return () => sub.unsubscribe();
 *   }, [articleId])
 * );
 * ```
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
 * restoration), use React effects instead.
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

    // If activity is currently active, run effect immediately.
    // This handles both initial focus and callback changes while focused.
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
    // callback in deps: changes trigger cleanup→re-run (React Navigation pattern)
    // activity.isActive intentionally excluded — onChanged handles subsequent transitions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, activity.id, callback]);
}
