import { useEffect } from "react";

import { useActivity } from "../__internal__/activity/useActivity";
import { noop } from "../__internal__/utils";

/**
 * @deprecated Use `useFocusEffect` from `@stackflow/react/future` instead.
 * `useFocusEffect` runs callbacks at the plugin level (outside React render cycle),
 * avoiding `useDeferredValue` tearing issues.
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
