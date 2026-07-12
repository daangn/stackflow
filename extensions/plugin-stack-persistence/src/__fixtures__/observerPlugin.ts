import type { Stack, StackflowPlugin, StackInitInfo } from "@stackflow/core";

export type ObserverPlugin = {
  plugin: StackflowPlugin;
  /** One entry per `onInit` call, with the stack observed at that moment. */
  initCalls: Array<{ kind: StackInitInfo["kind"]; stackAtInit: Stack }>;
  /** Post-effect tags (`PUSHED`, `STEP_PUSHED`, ...) in delivery order. */
  postEffects: string[];
};

/**
 * Neutral observation plugin: records `onInit`'s `initInfo.kind` and every
 * navigation post-effect without changing persistence behavior. Stands in
 * for any co-installed plugin (analytics, history-sync-like) that watches
 * the same core hooks.
 */
export function makeObserverPlugin(key = "test-observer"): ObserverPlugin {
  const initCalls: ObserverPlugin["initCalls"] = [];
  const postEffects: string[] = [];

  const plugin: StackflowPlugin = () => ({
    key,
    onInit({ actions, initInfo }) {
      initCalls.push({ kind: initInfo.kind, stackAtInit: actions.getStack() });
    },
    onPushed({ effect }) {
      postEffects.push(effect._TAG);
    },
    onReplaced({ effect }) {
      postEffects.push(effect._TAG);
    },
    onPopped({ effect }) {
      postEffects.push(effect._TAG);
    },
    onStepPushed({ effect }) {
      postEffects.push(effect._TAG);
    },
    onStepReplaced({ effect }) {
      postEffects.push(effect._TAG);
    },
    onStepPopped({ effect }) {
      postEffects.push(effect._TAG);
    },
    onPaused({ effect }) {
      postEffects.push(effect._TAG);
    },
    onResumed({ effect }) {
      postEffects.push(effect._TAG);
    },
  });

  return { plugin, initCalls, postEffects };
}
