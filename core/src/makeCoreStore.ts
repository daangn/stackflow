import isEqual from "react-fast-compare";

import type { Stack } from "./Stack";
import { aggregate } from "./aggregate";
import type { DomainEvent, PushedEvent, StepPushedEvent } from "./event-types";
import { makeEvent } from "./event-utils";
import type { StackflowActions, StackflowPlugin } from "./interfaces";
import { produceEffects } from "./produceEffects";
import { divideBy, once } from "./utils";
import { makeActions } from "./utils/makeActions";
import { triggerPostEffectHooks } from "./utils/triggerPostEffectHooks";

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
    initialPushedEventsByOption,
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

  const events: { value: DomainEvent[] } = {
    value: [...initialRemainingEvents, ...initialPushedEvents],
  };

  const stack = {
    value: aggregate(events.value, new Date().getTime()),
  };

  const actions: StackflowActions = {
    getStack() {
      return stack.value;
    },
    dispatchEvent(name, params) {
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
    },
    push: () => {},
    replace: () => {},
    pop: () => {},
    stepPush: () => {},
    stepReplace: () => {},
    stepPop: () => {},
    pause: () => {},
    resume: () => {},
  };

  const setStackValue = (nextStackValue: Stack) => {
    const effects = produceEffects(stack.value, nextStackValue);
    stack.value = nextStackValue;
    triggerPostEffectHooks(effects, pluginInstances, actions);
  };

  // Initialize action methods after actions object is fully created
  Object.assign(
    actions,
    makeActions({
      dispatchEvent: actions.dispatchEvent,
      pluginInstances,
      actions,
    }),
  );

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
