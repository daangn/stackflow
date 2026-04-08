import { useEffect } from "react";

import { useActivity } from "../__internal__/activity/useActivity";
import { noop } from "../__internal__/utils";

/**
 * Runs an effect when the activity becomes active (`isActive === true`).
 * Executes after React commit, so the callback sees a fully settled React tree.
 *
 * Best for effects that depend on React state/context (DOM manipulation, scroll restoration).
 *
 * For external side-effects (query invalidation, analytics) that should run immediately
 * on activity transition without waiting for React's deferred rendering,
 * use `useFocusEffect` from `@stackflow/react/future` instead.
 */
export const useActiveEffect = (effect: React.EffectCallback) => {
  const { isActive } = useActivity();

  useEffect(() => {
    if (isActive) {
      return effect();
    }

    return noop;
  }, [isActive]);
};
