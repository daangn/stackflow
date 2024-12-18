import isEqual from "react-fast-compare";

import type { Effect } from "./Effect";
import type { Stack } from "./Stack";
import { aggregate } from "./aggregate";
import type { DomainEvent, PushedEvent, StepPushedEvent } from "./event-types";
import type { BaseDomainEvent } from "./event-types/_base";
import { makeEvent } from "./event-utils";
import type { StackflowActions, StackflowPlugin } from "./interfaces";
import { produceEffects } from "./produceEffects";
import { divideBy, once } from "./utils";

const SECOND = 1000;

// 60FPS
const INTERVAL_MS = SECOND / 60;

export type MakeCoreStoreOptions = {
  initialEvents: DomainEvent[];
  initialContext?: any;
  plugins: StackflowPlugin[];
  handlers?: {
    onInitialActivityIgnored?: (
      initialPushedEvents: (PushedEvent | StepPushedEvent)[],
    ) => void;
    onInitialActivityNotFound?: () => void;
  };
};

export type CoreStore = {
  actions: StackflowActions;
  init: () => void;
  pullEvents: () => DomainEvent[];
  subscribe: (listener: () => void) => () => void;
  pluginInstances: ReturnType<StackflowPlugin>[];
};

export function makeCoreStore(options: MakeCoreStoreOptions): CoreStore {
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

  const [initialPushedEventsByOption, initialRemainingEvents] = divideBy(
    options.initialEvents,
    (e) => e.name === "Pushed" || e.name === "StepPushed",
  );

  const initialPushedEvents = pluginInstances.reduce(
    (initialEvents, pluginInstance) =>
      pluginInstance.overrideInitialEvents?.({
        initialEvents,
        initialContext: options.initialContext ?? {},
      }) ?? initialEvents,
    initialPushedEventsByOption as (PushedEvent | StepPushedEvent)[],
  );

  const isInitialActivityIgnored =
    initialPushedEvents.length > 0 &&
    initialPushedEventsByOption.length > 0 &&
    initialPushedEvents !== initialPushedEventsByOption;

  if (isInitialActivityIgnored) {
    options.handlers?.onInitialActivityIgnored?.(initialPushedEvents);
  }

  if (initialPushedEvents.length === 0) {
    options.handlers?.onInitialActivityNotFound?.();
  }

  const events: {
    value: DomainEvent[];
  } = {
    value: [...initialRemainingEvents, ...initialPushedEvents],
  };

  const stack = {
    value: aggregate(events.value, new Date().getTime()),
  };

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

  type TriggerPreEffectHooksInput<K extends DomainEvent["name"]> =
    K extends DomainEvent["name"]
      ? {
          actionName: K;
          actionParams: Omit<
            Extract<DomainEvent, { name: K }>,
            keyof BaseDomainEvent
          >;
          pluginInstances: ReturnType<StackflowPlugin>[];
        }
      : unknown;

  function triggerPreEffectHooks(
    input: TriggerPreEffectHooksInput<DomainEvent["name"]>,
  ): {
    isPrevented: boolean;
    nextActionParams: (typeof input)["actionParams"];
  } {
    switch (input.actionName) {
      case "Pushed": {
        let isPrevented = false;

        let nextActionParams = {
          ...input.actionParams,
        };

        const preventDefault = () => {
          isPrevented = true;
        };

        const overrideActionParams = (
          partialActionParams: typeof input.actionParams,
        ) => {
          nextActionParams = {
            ...nextActionParams,
            ...partialActionParams,
          };
        };

        for (const pluginInstance of input.pluginInstances) {
          pluginInstance.onBeforePush?.({
            actionParams: {
              ...nextActionParams,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
        }

        return {
          isPrevented,
          nextActionParams,
        };
      }
      case "Replaced": {
        let isPrevented = false;

        let nextActionParams = {
          ...input.actionParams,
        };

        const preventDefault = () => {
          isPrevented = true;
        };

        const overrideActionParams = (
          partialActionParams: typeof input.actionParams,
        ) => {
          nextActionParams = {
            ...nextActionParams,
            ...partialActionParams,
          };
        };

        for (const pluginInstance of input.pluginInstances) {
          pluginInstance.onBeforeReplace?.({
            actionParams: {
              ...nextActionParams,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
        }

        return {
          isPrevented,
          nextActionParams,
        };
      }
      case "Popped": {
        let isPrevented = false;

        let nextActionParams = {
          ...input.actionParams,
        };

        const preventDefault = () => {
          isPrevented = true;
        };

        const overrideActionParams = (
          partialActionParams: typeof input.actionParams,
        ) => {
          nextActionParams = {
            ...nextActionParams,
            ...partialActionParams,
          };
        };

        for (const pluginInstance of input.pluginInstances) {
          pluginInstance.onBeforePop?.({
            actionParams: {
              ...nextActionParams,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
        }

        return {
          isPrevented,
          nextActionParams,
        };
      }
      case "StepPushed": {
        let isPrevented = false;

        let nextActionParams = {
          ...input.actionParams,
        };

        const preventDefault = () => {
          isPrevented = true;
        };

        const overrideActionParams = (
          partialActionParams: typeof input.actionParams,
        ) => {
          nextActionParams = {
            ...nextActionParams,
            ...partialActionParams,
          };
        };

        for (const pluginInstance of input.pluginInstances) {
          pluginInstance.onBeforeStepPush?.({
            actionParams: {
              ...nextActionParams,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
        }

        return {
          isPrevented,
          nextActionParams,
        };
      }
      case "StepReplaced": {
        let isPrevented = false;

        let nextActionParams = {
          ...input.actionParams,
        };

        const preventDefault = () => {
          isPrevented = true;
        };

        const overrideActionParams = (
          partialActionParams: typeof input.actionParams,
        ) => {
          nextActionParams = {
            ...nextActionParams,
            ...partialActionParams,
          };
        };

        for (const pluginInstance of input.pluginInstances) {
          pluginInstance.onBeforeStepReplace?.({
            actionParams: {
              ...nextActionParams,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
        }

        return {
          isPrevented,
          nextActionParams,
        };
      }
      case "StepPopped": {
        let isPrevented = false;

        let nextActionParams = {
          ...input.actionParams,
        };

        const preventDefault = () => {
          isPrevented = true;
        };

        const overrideActionParams = (
          partialActionParams: typeof input.actionParams,
        ) => {
          nextActionParams = {
            ...nextActionParams,
            ...partialActionParams,
          };
        };

        for (const pluginInstance of input.pluginInstances) {
          pluginInstance.onBeforeStepPop?.({
            actionParams: {
              ...nextActionParams,
            },
            actions: {
              ...actions,
              preventDefault,
              overrideActionParams,
            },
          });
        }

        return {
          isPrevented,
          nextActionParams,
        };
      }
      default: {
        return {
          isPrevented: false,
          nextActionParams: input.actionParams,
        };
      }
    }
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
      const { isPrevented, nextActionParams } = triggerPreEffectHooks({
        actionName: "Pushed",
        actionParams: params,
        pluginInstances,
      });

      if (isPrevented) {
        return;
      }

      dispatchEvent("Pushed", nextActionParams);
    },
    replace(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHooks({
        actionName: "Replaced",
        actionParams: params,
        pluginInstances,
      });

      if (isPrevented) {
        return;
      }

      dispatchEvent("Replaced", nextActionParams);
    },
    pop(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHooks({
        actionName: "Popped",
        actionParams: params ?? {},
        pluginInstances,
      });

      if (isPrevented) {
        return;
      }

      dispatchEvent("Popped", nextActionParams);
    },
    stepPush(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHooks({
        actionName: "StepPushed",
        actionParams: params,
        pluginInstances,
      });

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepPushed", nextActionParams);
    },
    stepReplace(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHooks({
        actionName: "StepReplaced",
        actionParams: params,
        pluginInstances,
      });

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepReplaced", nextActionParams);
    },
    stepPop(params) {
      const { isPrevented, nextActionParams } = triggerPreEffectHooks({
        actionName: "StepPopped",
        actionParams: params ?? {},
        pluginInstances,
      });

      if (isPrevented) {
        return;
      }

      dispatchEvent("StepPopped", nextActionParams);
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
    pluginInstances,
  };
}
