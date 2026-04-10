import { useEffect } from "react";

import { useActivity } from "../future/activity/useActivity";
import { noop } from "../future/utils";

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
