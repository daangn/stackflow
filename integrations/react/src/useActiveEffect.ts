import { useEffect } from "react";

import { useActivity } from "./activity/useActivity";

export const useActiveEffect = (effect: React.EffectCallback) => {
  const { isActive } = useActivity();

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (isActive) {
      return effect();
    }
  }, [isActive]);
};
