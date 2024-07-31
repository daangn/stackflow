import { useEffect } from "react";

import { useActivity } from "../__internal__/activity/useActivity";
import { noop } from "../__internal__/utils";

export const useEnterDoneEffect = (
  effect: React.EffectCallback,
  deps: React.DependencyList = [],
) => {
  const { isTop, transitionState } = useActivity();

  useEffect(() => {
    if (isTop && transitionState === "enter-done") {
      return effect();
    }

    return noop;
  }, [isTop, transitionState, ...deps]);
};
