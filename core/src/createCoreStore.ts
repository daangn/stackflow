/* eslint-disable no-use-before-define */

import isEqual from "react-fast-compare";

import { aggregate } from "./aggregate";
import type { AggregateOutput } from "./AggregateOutput";
import type { Effect } from "./Effect";
import type { DomainEvent } from "./event-types";
import type { BaseDomainEvent } from "./event-types/_base";
import { makeEvent } from "./event-utils";
import type { StackflowActions, StackflowPlugin } from "./interfaces";
import { produceEffects } from "./produceEffects";

const SECOND = 1000;

// 60FPS
const INTERVAL_MS = SECOND / 60;

export type CreateCoreStoreOptions = {
  initialEvents: DomainEvent[];
  plugins: StackflowPlugin[];
};

export type CreateCoreStoreOutput = {
  actions: StackflowActions;
  subscribe: (listener: () => void) => () => void;
};

export function createCoreStore(
  options: CreateCoreStoreOptions,
): CreateCoreStoreOutput {
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

  const setStackValue = (nextStackValue: AggregateOutput) => {
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
    overridenParams: Omit<T, keyof BaseDomainEvent>;
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
      overridenParams: toParams(nextEvent),
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
      const { isPrevented, overridenParams } = triggerPreEffectHooks(
        makeEvent("Pushed", params),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Pushed", overridenParams);
    },
    replace(params) {
      const { isPrevented, overridenParams } = triggerPreEffectHooks(
        makeEvent("Replaced", params),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Replaced", overridenParams);
    },
    pop(params) {
      const { isPrevented, overridenParams } = triggerPreEffectHooks(
        makeEvent("Popped", params ?? {}),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("Popped", overridenParams);
    },
    stepPush(params) {
      const { isPrevented, overridenParams } = triggerPreEffectHooks(
        makeEvent("StepPushed", params ?? {}),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepPushed", overridenParams);
    },
    stepReplace(params) {
      const { isPrevented, overridenParams } = triggerPreEffectHooks(
        makeEvent("StepReplaced", params ?? {}),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepReplaced", overridenParams);
    },
    stepPop(params) {
      const { isPrevented, overridenParams } = triggerPreEffectHooks(
        makeEvent("StepPopped", params ?? {}),
        pluginInstances,
      );

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepPopped", overridenParams);
    },
  };

  pluginInstances.forEach((pluginInstance) => {
    pluginInstance.onInit?.({
      actions,
    });
  });

  return {
    actions,
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
