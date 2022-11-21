/* eslint-disable no-use-before-define */

import isEqual from "react-fast-compare";

import { aggregate } from "./aggregate";
import type { AggregateOutput } from "./AggregateOutput";
import type { Effect } from "./Effect";
import type { DomainEvent } from "./event-types";
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
  coreActions: StackflowActions;
  subscribe: (listener: () => void) => () => void;
};

export function createCoreStore(
  options: CreateCoreStoreOptions,
): CreateCoreStoreOutput {
  const events = [...options.initialEvents];
  const stack = {
    value: aggregate(events, new Date().getTime()),
  };

  const storeListeners: Array<() => void> = [];

  const defaultPlugin: StackflowPlugin = () => ({
    key: "@stackflow/core",
    onChanged() {
      storeListeners.forEach((listener) => listener());
    },
  });

  const plugins: ReturnType<StackflowPlugin>[] = [
    defaultPlugin(),
    ...options.plugins.map((plugin) => plugin()),
  ];

  const setStackValue = (nextStackValue: AggregateOutput) => {
    const effects = produceEffects(stack.value, nextStackValue);

    stack.value = nextStackValue;

    triggerPostEffectHooks(effects, plugins);
  };

  const dispatchEvent: StackflowActions["dispatchEvent"] = (name, params) => {
    const newEvent = makeEvent(name, params);

    const { isPrevented } = triggerPreEffectHooks(newEvent, plugins);

    if (isPrevented) {
      return;
    }

    const nextStackValue = aggregate(
      [...events, newEvent],
      new Date().getTime(),
    );

    events.push(newEvent);
    setStackValue(nextStackValue);

    const interval = setInterval(() => {
      const nextStackValue = aggregate(events, new Date().getTime());

      if (!isEqual(stack.value, nextStackValue)) {
        setStackValue(nextStackValue);
      }

      if (nextStackValue.globalTransitionState === "idle") {
        clearInterval(interval);
      }
    }, INTERVAL_MS);
  };

  function triggerPreEffectHooks(
    event: DomainEvent,
    plugins: ReturnType<StackflowPlugin>[],
  ) {
    let isPrevented = false;
    let __event: DomainEvent = {
      ...event,
    };

    const preventDefault = () => {
      isPrevented = true;
    };
    const overrideActionParams = (nextActionParams: any) => {
      __event = {
        ...__event,
        ...nextActionParams,
      };
    };

    plugins.forEach((plugin) => {
      switch (__event.name) {
        case "Pushed": {
          plugin.onBeforePush?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...coreActions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "Replaced": {
          plugin.onBeforeReplace?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...coreActions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "Popped": {
          plugin.onBeforePop?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...coreActions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "StepPushed": {
          plugin.onBeforeStepPush?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...coreActions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "StepReplaced": {
          plugin.onBeforeStepReplace?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...coreActions,
              preventDefault,
              overrideActionParams,
            },
          });
          break;
        }
        case "StepPopped": {
          plugin.onBeforeStepPop?.({
            actionParams: {
              ...__event,
            },
            actions: {
              ...coreActions,
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
              actions: coreActions,
              effect,
            });
          case "REPLACED":
            return plugin.onReplaced?.({
              actions: coreActions,
              effect,
            });
          case "POPPED":
            return plugin.onPopped?.({
              actions: coreActions,
              effect,
            });
          case "STEP_PUSHED":
            return plugin.onStepPushed?.({
              actions: coreActions,
              effect,
            });
          case "STEP_REPLACED":
            return plugin.onStepReplaced?.({
              actions: coreActions,
              effect,
            });
          case "STEP_POPPED":
            return plugin.onStepPopped?.({
              actions: coreActions,
              effect,
            });
          case "%SOMETHING_CHANGED%":
            return plugin.onChanged?.({
              actions: coreActions,
              effect,
            });
          default:
            return undefined;
        }
      });
    });
  }

  const coreActions: StackflowActions = {
    getStack() {
      return stack.value;
    },
    dispatchEvent,
    push(params) {
      dispatchEvent("Pushed", params);
    },
    replace(params) {
      dispatchEvent("Replaced", params);
    },
    pop(params) {
      dispatchEvent("Popped", params ?? {});
    },
    stepPush(params) {
      dispatchEvent("StepPushed", params);
    },
    stepReplace(params) {
      dispatchEvent("StepReplaced", params);
    },
    stepPop(params) {
      dispatchEvent("StepPopped", params ?? {});
    },
  };

  return {
    coreActions,
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
