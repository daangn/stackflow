/* eslint-disable no-use-before-define */

import isEqual from "react-fast-compare";

import { aggregate } from "./aggregate";
import type { Effect } from "./Effect";
import type { DomainEvent } from "./event-types";
import type { BaseDomainEvent } from "./event-types/_base";
import { makeEvent } from "./event-utils";
import type { StackflowActions, StackflowPlugin } from "./interfaces";
import { produceEffects } from "./produceEffects";
import type { Stack } from "./Stack";
import { once } from "./utils";

const SECOND = 1000;

// 60FPS
const INTERVAL_MS = SECOND / 60;

export type MakeCoreStoreOptions = {
  initialEvents: DomainEvent[];
  plugins: StackflowPlugin[];
};

export type CoreStore = {
  actions: StackflowActions;
  init: () => void;
  pullEvents: () => DomainEvent[];
  subscribe: (listener: () => void) => () => void;
};

export function makeCoreStore(options: MakeCoreStoreOptions): CoreStore {
  const events: {
    value: DomainEvent[];
  } = {
    value: [...options.initialEvents],
  };
  const stack = {
    value: aggregate(events.value, new Date().getTime()),
  };

  const storeListeners: Array<() => void> = [];

  const defaultPlugin: StackflowPlugin = () => ({
    key: "@stackflow/core",
    onChanged() {
      storeListeners.forEach((listener) => listener());
    },
  });

  const pluginInstances: ReturnType<StackflowPlugin>[] = [
    defaultPlugin(),
    ...options.plugins.map((plugin) => plugin()),
  ];

  const setStackValue = (nextStackValue: Stack) => {
    const effects = produceEffects(stack.value, nextStackValue);

    stack.value = nextStackValue;

    triggerPostEffectHooks(effects, pluginInstances);
  };

  const dispatchEvent: StackflowActions["dispatchEvent"] = (name, params) => {
    const newEvent = makeEvent(name, params);

    const nextStackValue = aggregate(
      [...events.value, newEvent],
      new Date().getTime(),
    );

    events.value.push(newEvent);
    setStackValue(nextStackValue);

    const interval = setInterval(() => {
      const nextStackValue = aggregate(events.value, new Date().getTime());

      if (!isEqual(stack.value, nextStackValue)) {
        setStackValue(nextStackValue);
      }

      if (nextStackValue.globalTransitionState === "idle") {
        clearInterval(interval);
      }
    }, INTERVAL_MS);
  };

  function triggerPreEffectHooks<T extends DomainEvent>(
    event: T,
    plugins: ReturnType<StackflowPlugin>[],
  ): {
    isPrevented: boolean;
    overriddenParams: Omit<T, keyof BaseDomainEvent>;
  } {
    let isPrevented = false;
    let nextEvent: T = {
      ...event,
    };

    function toParams(event: T): Omit<T, keyof BaseDomainEvent> {
      const params: Partial<BaseDomainEvent> & Omit<T, keyof BaseDomainEvent> =
        { ...event };

      // delete params.id;
      // delete params.eventDate;
      delete params.name;

      return params;
    }

    const preventDefault = () => {
      isPrevented = true;
    };
    const overrideActionParams = (nextActionParams: any) => {
      nextEvent = {
        ...nextEvent,
        ...nextActionParams,
      };
    };

    plugins.forEach((plugin) => {
      switch (nextEvent.name) {
        case "Pushed": {
          plugin.onBeforePush?.({
            actionParams: {
              ...nextEvent,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "Replaced": {
          plugin.onBeforeReplace?.({
            actionParams: {
              ...nextEvent,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "Popped": {
          plugin.onBeforePop?.({
            actionParams: {
              ...nextEvent,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "StepPushed": {
          plugin.onBeforeStepPush?.({
            actionParams: {
              ...nextEvent,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "StepReplaced": {
          plugin.onBeforeStepReplace?.({
            actionParams: {
              ...nextEvent,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "StepPopped": {
          plugin.onBeforeStepPop?.({
            actionParams: {
              ...nextEvent,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        default:
          break;
      }
    });

    return {
      isPrevented,
      overriddenParams: toParams(nextEvent),
    };
  }

  function triggerPostEffectHooks(
    effects: Effect[],
    plugins: ReturnType<StackflowPlugin>[],
  ) {
    effects.forEach((effect) => {
      plugins.forEach((plugin) => {
        switch (effect._TAG) {
          case "PUSHED":
            return plugin.onPushed?.({
              actions,
              effect,
            });
          case "REPLACED":
            return plugin.onReplaced?.({
              actions,
              effect,
            });
          case "POPPED":
            return plugin.onPopped?.({
              actions,
              effect,
            });
          case "STEP_PUSHED":
            return plugin.onStepPushed?.({
              actions,
              effect,
            });
          case "STEP_REPLACED":
            return plugin.onStepReplaced?.({
              actions,
              effect,
            });
          case "STEP_POPPED":
            return plugin.onStepPopped?.({
              actions,
              effect,
            });
          case "%SOMETHING_CHANGED%":
            return plugin.onChanged?.({
              actions,
              effect,
            });
          default:
            return undefined;
        }
      });
    });
  }

  const actions: StackflowActions = {
    getStack() {
      return stack.value;
    },
    dispatchEvent,
    push(params) {
      const { isPrevented, overriddenParams } = triggerPreEffectHooks(
        makeEvent("Pushed", params),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Pushed", overriddenParams);
    },
    replace(params) {
      const { isPrevented, overriddenParams } = triggerPreEffectHooks(
        makeEvent("Replaced", params),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Replaced", overriddenParams);
    },
    pop(params) {
      const { isPrevented, overriddenParams } = triggerPreEffectHooks(
        makeEvent("Popped", params ?? {}),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Popped", overriddenParams);
    },
    stepPush(params) {
      const { isPrevented, overriddenParams } = triggerPreEffectHooks(
        makeEvent("StepPushed", params ?? {}),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepPushed", overriddenParams);
    },
    stepReplace(params) {
      const { isPrevented, overriddenParams } = triggerPreEffectHooks(
        makeEvent("StepReplaced", params ?? {}),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepReplaced", overriddenParams);
    },
    stepPop(params) {
      const { isPrevented, overriddenParams } = triggerPreEffectHooks(
        makeEvent("StepPopped", params ?? {}),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepPopped", overriddenParams);
    },
  };

  return {
    actions,
    init: once(() => {
      pluginInstances.forEach((pluginInstance) => {
        pluginInstance.onInit?.({
          actions,
        });
      });
    }),
    pullEvents: () => events.value,
    subscribe(listener) {
      storeListeners.push(listener);

      return function dispose() {
        const listenerIndex = storeListeners.findIndex((l) => l === listener);

        if (listenerIndex > -1) {
          storeListeners.splice(listenerIndex, 1);
        }
      };
    },
  };
}
