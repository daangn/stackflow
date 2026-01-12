import type { Aggregator } from "./aggregators/Aggregator";
import { SyncAggregator } from "./aggregators/SyncAggregator";
import type { DomainEvent, PushedEvent, StepPushedEvent } from "./event-types";
import { makeEvent } from "./event-utils";
import type { StackflowActions, StackflowPlugin } from "./interfaces";
import { divideBy, once } from "./utils";
import { makeActions } from "./utils/makeActions";
import { ScheduledPublisher } from "./utils/publishers/ScheduledPublisher";
import { SequentialScheduler } from "./utils/schedulers/SequentialScheduler";
import { SwitchScheduler } from "./utils/schedulers/SwitchScheduler";
import { triggerPostEffectHooks } from "./utils/triggerPostEffectHooks";

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

  const aggregator: Aggregator = new SyncAggregator({
    changePublisher: new ScheduledPublisher(new SequentialScheduler()),
    updateScheduler: new SwitchScheduler({
      scheduler: new SequentialScheduler(),
    }),
    updateErrorReporter: (error) => {
      console.error(error);
    },
    initialEvents: [...initialRemainingEvents, ...initialPushedEvents],
  });

  aggregator.subscribeChanges((effects) => {
    triggerPostEffectHooks(effects, pluginInstances, actions);
  });

  const actions: StackflowActions = {
    getStack() {
      return aggregator.getStack();
    },
    dispatchEvent(name, params) {
      const newEvent = makeEvent(name, params);

      aggregator.dispatchEvent(newEvent);
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
    pullEvents: () => aggregator.getStack().events,
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
