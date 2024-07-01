import { createEffect } from "solid-js";

import { useActivity } from "../__internal__/activity/useActivity";

export const createEnterDoneEffect = (
  effect: () => void,
  deps?: () => void,
) => {
  const activity = useActivity();

  createEffect(() => {
    void deps?.();
    if (activity()?.isTop && activity()?.transitionState === "enter-done") {
      return effect();
    }
  });
};
