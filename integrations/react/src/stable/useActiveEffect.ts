import { useEffect } from "react";

import { useActivity } from "../future/activity/useActivity";
import { noop } from "../future/utils";

export const useActiveEffect = (effect: React.EffectCallback) => {
  const { isActive } = useActivity();

  useEffect(() => {
    if (isActive) {
      return effect();
    }

    return noop;
  }, [isActive]);
};
