import { useEffect } from "react";

import { useActivity } from "./activity/useActivity";
import { noop } from "./utils";

export const useActiveEffect = (effect: React.EffectCallback) => {
  const { isActive } = useActivity();

  useEffect(() => {
    if (isActive) {
      return effect();
    }

    return noop;
  }, [isActive]);
};
