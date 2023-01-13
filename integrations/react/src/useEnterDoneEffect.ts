import { useEffect } from "react";

import { useActivity } from "./activity/useActivity";

const useEnterDoneEffect = (
  effect: React.EffectCallback,
  deps: React.DependencyList = [],
) => {
  const { isTop, transitionState } = useActivity();

  useEffect(() => {
    if (isTop && transitionState === "enter-done") {
      return effect();
    }
  }, [isTop, transitionState, ...deps]);
};

export default useEnterDoneEffect;
