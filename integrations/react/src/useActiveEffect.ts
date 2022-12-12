import { useEffect, useRef } from "react";

import { useActivity } from "./activity/useActivity";

export const useActiveEffect = (effect: React.EffectCallback) => {
  const { isActive } = useActivity();
  const cleanup = useRef<ReturnType<React.EffectCallback> | null>(null);

  useEffect(() => {
    if (isActive) {
      cleanup.current = effect();
    } else {
      cleanup.current?.();
    }
  }, [isActive]);
};
