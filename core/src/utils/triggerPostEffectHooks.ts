import type { Effect } from "../Effect";
import type { StackflowActions, StackflowPlugin } from "../interfaces";

export function triggerPostEffectHooks(
  effects: Effect[],
  plugins: ReturnType<StackflowPlugin>[],
  actions: StackflowActions,
): void {
  effects.forEach((effect) => {
    plugins.forEach((plugin) => {
      switch (effect._TAG) {
        case "PUSHED":
          plugin.onPushed?.({ actions, effect });
          break;
        case "REPLACED":
          plugin.onReplaced?.({ actions, effect });
          break;
        case "POPPED":
          plugin.onPopped?.({ actions, effect });
          break;
        case "STEP_PUSHED":
          plugin.onStepPushed?.({ actions, effect });
          break;
        case "STEP_REPLACED":
          plugin.onStepReplaced?.({ actions, effect });
          break;
        case "STEP_POPPED":
          plugin.onStepPopped?.({ actions, effect });
          break;
        case "PAUSED":
          plugin.onPaused?.({ actions, effect });
          break;
        case "RESUMED":
          plugin.onResumed?.({ actions, effect });
          break;
        case "%SOMETHING_CHANGED%":
          plugin.onChanged?.({ actions, effect });
          break;
      }
    });
  });
}
