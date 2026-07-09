import isEqual from "react-fast-compare";
import { aggregate } from "./aggregate";
import type { DomainEvent } from "./event-types";
import { isNavigationEvent, makeEvent } from "./event-utils";
import type {
  StackflowActions,
  StackflowPlugin,
  StackInitInfo,
} from "./interfaces";
import { loadSnapshot } from "./loadSnapshot";
import { produceEffects } from "./produceEffects";
import { SnapshotLoadError } from "./SnapshotLoadError";
import type { Stack } from "./Stack";
import type { NavigationEvent, StackSnapshot } from "./StackSnapshot";
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
      initialPushedEvents: NavigationEvent[],
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

  // One chain for both paths: each plugin sees the previous plugin's return,
  // with initInfo telling which path is running. On load the return is the
  // replay sequence, so it goes back through the load validation afterwards.
  const overrideInitialEvents = (
    initialEvents: NavigationEvent[],
    initInfo: StackInitInfo,
  ): NavigationEvent[] =>
    pluginInstances.reduce(
      (events, pluginInstance) =>
        pluginInstance.overrideInitialEvents?.({
          initialEvents: events,
          initialContext,
          initInfo,
        }) ?? events,
      initialEvents,
    );

  /**
   * The create path keeps the pre-snapshot pipeline — with no snapshot
   * provider the store is built exactly as before; the only addition the
   * chain sees is the initInfo signal.
   */
  const createStack = (): Stack => {
    const initialPushedEvents = overrideInitialEvents(
      initialPushedEventsByOption,
      { kind: "create" },
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

  let initInfo: { kind: "create" | "load" };
  let stackValue: Stack;

  if (suppliedSnapshots.length === 1) {
    const { pluginInstance, snapshot } = suppliedSnapshots[0];

    try {
      const loaded = loadSnapshot(snapshot, initialRemainingEvents, (events) =>
        overrideInitialEvents(events, { kind: "load" }),
      );
      events.value = loaded.events;
      stackValue = loaded.stack;
      initInfo = { kind: "load" };
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
      initInfo = { kind: "create" };
    }
  } else {
    stackValue = createStack();
    initInfo = { kind: "create" };
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
      // A snapshot is the last committed navigation history: it carries only
      // events whose own transition has settled. Load is effect-silent (it
      // assigns the reconstructed stack directly and replays no
      // PUSHED/onChanged effect) and the rebase drives every restored event to
      // done — so an event still mid-transition, or queued behind a pause that
      // never resumed, would reappear on reload as a settled state the live
      // session never committed and never fired its done-effect for. Re-
      // aggregate the raw log to read each event's committed state, flooring
      // now at the latest event date the way dispatchEvent does so a
      // just-committed event is read as settled rather than future-dated.
      const now = events.value.reduce(
        (latest, event) => Math.max(latest, event.eventDate),
        Date.now(),
      );
      const stack = aggregate(events.value, now);

      const uncommittedEventIds = new Set<string>();
      for (const activity of stack.activities) {
        // Drop the entering event of an activity still mid-enter (the activity
        // has not committed) and the exiting event of one still mid-exit (its
        // last committed state is preserved). Per-event, not per-activity: a
        // settled Pushed and an unsettled Popped can point at the same
        // activity, and only the Popped drops.
        if (activity.transitionState === "enter-active") {
          uncommittedEventIds.add(activity.enteredBy.id);
        } else if (
          activity.transitionState === "exit-active" &&
          activity.exitedBy
        ) {
          uncommittedEventIds.add(activity.exitedBy.id);
        }
      }
      for (const pausedEvent of stack.pausedEvents ?? []) {
        // Queued behind a pause that never resumed — never applied, so never
        // committed.
        uncommittedEventIds.add(pausedEvent.id);
      }

      // Normalize the raw log the way aggregate pre-processes — sort by
      // eventDate ascending, dedupe by id — keep only committed navigation
      // events. The resulting array order is the replay order.
      const navigationEvents = uniqBy(
        [...events.value].sort((a, b) => a.eventDate - b.eventDate),
        (e) => e.id,
      )
        .filter(isNavigationEvent)
        .filter((event) => !uncommittedEventIds.has(event.id));

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
          initInfo,
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
