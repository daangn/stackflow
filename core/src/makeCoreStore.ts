import isEqual from "react-fast-compare";
import { aggregate } from "./aggregate";
import type { DomainEvent, PushedEvent, StepPushedEvent } from "./event-types";
import { isNavigationEvent, makeEvent } from "./event-utils";
import type { StackflowActions, StackflowPlugin } from "./interfaces";
import { loadSnapshot } from "./loadSnapshot";
import { produceEffects } from "./produceEffects";
import { SnapshotLoadError } from "./SnapshotLoadError";
import type { Stack } from "./Stack";
import type { StackSnapshot } from "./StackSnapshot";
import { divideBy, once, uniqBy } from "./utils";
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

  const initialContext = options.initialContext ?? {};

  const [initialPushedEventsByOption, initialRemainingEvents] = divideBy(
    options.initialEvents,
    (e) => e.name === "Pushed" || e.name === "StepPushed",
  );

  const events: { value: DomainEvent[] } = {
    value: [],
  };

  /**
   * The create path is unchanged from the pre-snapshot behavior — a store
   * with no snapshot provider is observably identical to before.
   */
  const createStack = (): Stack => {
    const initialPushedEvents = pluginInstances.reduce(
      (initialEvents, pluginInstance) =>
        pluginInstance.overrideInitialEvents?.({
          initialEvents,
          initialContext,
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

    events.value = [...initialRemainingEvents, ...initialPushedEvents];

    return aggregate(events.value, new Date().getTime());
  };

  // Poll every plugin for a snapshot to load from (§3.3). `null`/`undefined`
  // means "nothing to provide". More than one non-null supply is a wiring bug,
  // not a snapshot defect — throw a plain creation error naming the keys,
  // without routing to any `onLoadError` (R9).
  const suppliedSnapshots = pluginInstances
    .map((pluginInstance) => ({
      pluginInstance,
      snapshot: pluginInstance.provideSnapshot?.({ initialContext }) ?? null,
    }))
    .filter(
      (
        supply,
      ): supply is {
        pluginInstance: ReturnType<StackflowPlugin>;
        snapshot: StackSnapshot;
      } => supply.snapshot != null,
    );

  if (suppliedSnapshots.length > 1) {
    const keys = suppliedSnapshots.map((supply) => supply.pluginInstance.key);
    throw new Error(
      `More than one plugin provided a snapshot (${keys.join(
        ", ",
      )}). A stack loads from at most one snapshot; resolve which provider wins in a layer above core.`,
    );
  }

  let initializedBy: "create" | "load";
  let stackValue: Stack;

  if (suppliedSnapshots.length === 1) {
    const { pluginInstance, snapshot } = suppliedSnapshots[0];

    try {
      const loaded = loadSnapshot(snapshot, initialRemainingEvents);
      events.value = loaded.events;
      stackValue = loaded.stack;
      initializedBy = "load";
    } catch (error) {
      if (!(error instanceof SnapshotLoadError)) {
        throw error;
      }

      // The failing snapshot's provider gets first refusal (R5). An explicit
      // `{ recover: "create" }` resumes the create path without re-polling
      // (C1); anything else rethrows out of makeCoreStore (R4).
      const recovery = pluginInstance.onLoadError?.({
        error,
        initialContext,
      });

      if (recovery?.recover !== "create") {
        throw error;
      }

      stackValue = createStack();
      initializedBy = "create";
    }
  } else {
    stackValue = createStack();
    initializedBy = "create";
  }

  const stack = {
    value: stackValue,
  };

  let currentInterval: ReturnType<typeof setInterval> | null = null;

  const actions: StackflowActions = {
    getStack() {
      return stack.value;
    },
    captureSnapshot() {
      // Read the raw event log (not aggregated state, so pause-queued events
      // are still included) and normalize it the way aggregate pre-processes:
      // sort by eventDate ascending, dedupe by id, then keep only navigation
      // events. The resulting array order is the replay order.
      const navigationEvents = uniqBy(
        [...events.value].sort((a, b) => a.eventDate - b.eventDate),
        (e) => e.id,
      ).filter(isNavigationEvent);

      return {
        $schema: "stackflow.snapshot.v1",
        events: navigationEvents,
      };
    },
    dispatchEvent(name, params) {
      const newEvent = makeEvent(name, params);

      const nextStackValue = aggregate(
        [...events.value, newEvent],
        Math.max(newEvent.eventDate, new Date().getTime()),
      );

      events.value.push(newEvent);
      setStackValue(nextStackValue);

      if (currentInterval !== null) {
        clearInterval(currentInterval);
      }

      const interval = setInterval(() => {
        const nextStackValue = aggregate(events.value, new Date().getTime());

        if (!isEqual(stack.value, nextStackValue)) {
          setStackValue(nextStackValue);
        }

        if (nextStackValue.globalTransitionState === "idle") {
          clearInterval(interval);
          if (currentInterval === interval) {
            currentInterval = null;
          }
        }
      }, INTERVAL_MS);
      currentInterval = interval;
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
          initializedBy,
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
