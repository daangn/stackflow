import { useEffect } from "react";

import { useActivity } from "../__internal__/activity/useActivity";
import { noop } from "../__internal__/utils";

export const useActiveEffect = (effect: React.EffectCallback) => {
  const { isActive } = useActivity();

  useEffect(() => {
    if (isActive) {
      return effect();
    }

    return noop;
  }, [isActive]);
};
