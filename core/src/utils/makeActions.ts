import type { StackflowActions } from "../interfaces";
import type { StackflowPlugin } from "../interfaces";
import { triggerPreEffectHook } from "./triggerPreEffectHooks";

type ActionCreatorOptions = {
  dispatchEvent: StackflowActions["dispatchEvent"];
  pluginInstances: ReturnType<StackflowPlugin>[];
  actions: StackflowActions;
};

export function makeActions({
  dispatchEvent,
  pluginInstances,
  actions,
}: ActionCreatorOptions): Omit<StackflowActions, "dispatchEvent" | "getStack"> {
  return {
    push(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "Pushed",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Pushed", nextActionParams);
    },
    replace(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "Replaced",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Replaced", nextActionParams);
    },
    pop(params = {}) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "Popped",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Popped", nextActionParams);
    },
    stepPush(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "StepPushed",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepPushed", nextActionParams);
    },
    stepReplace(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "StepReplaced",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepReplaced", nextActionParams);
    },
    stepPop(params = {}) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "StepPopped",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepPopped", nextActionParams);
    },
    pause(params = {}) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "Paused",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Paused", nextActionParams);
    },
    resume(params = {}) {
      const { isPrevented, nextActionParams } = triggerPreEffectHook(
        "Resumed",
        params,
        pluginInstances,
        actions,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Resumed", nextActionParams);
    },
  };
}
