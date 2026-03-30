import type { StackflowReactPlugin } from "../../__internal__/StackflowReactPlugin";
import { createContext, createElement, useContext } from "react";
import { runSafely } from "./runSafely";

type FocusEffectEntry = {
  id: symbol;
  activityId: string;
  callbackRef: { current: () => (() => void) | void };
};

type LifecycleStore = {
  entries: Map<symbol, FocusEffectEntry>;
  cleanups: Map<symbol, (() => void) | void>;
  prevActiveActivityId: string | null;
};

const LifecycleStoreContext = createContext<LifecycleStore | null>(null);

export function useLifecycleStore(): LifecycleStore {
  const store = useContext(LifecycleStoreContext);
  if (!store) {
    throw new Error(
      "lifecyclePlugin() must be registered before using useFocusEffect()",
    );
  }
  return store;
}

export function lifecyclePlugin(): StackflowReactPlugin {
  const store: LifecycleStore = {
    entries: new Map(),
    cleanups: new Map(),
    prevActiveActivityId: null,
  };

  return () => ({
    key: "@stackflow/plugin-lifecycle",

    onInit({ actions }) {
      const stack = actions.getStack();
      const activeActivity = stack.activities.find((a) => a.isActive);
      store.prevActiveActivityId = activeActivity?.id ?? null;
    },

    wrapStack({ stack }) {
      return createElement(
        LifecycleStoreContext.Provider,
        { value: store },
        stack.render(),
      );
    },

    onChanged({ actions }) {
      const currentStack = actions.getStack();
      const activeActivity = currentStack.activities.find((a) => a.isActive);
      const currentActiveId = activeActivity?.id ?? null;

      if (currentActiveId === store.prevActiveActivityId) {
        return;
      }

      const prevActiveId = store.prevActiveActivityId;
      store.prevActiveActivityId = currentActiveId;

      // 1. Blur: cleanup previous active activity's entries
      if (prevActiveId !== null) {
        for (const [entryId, entry] of store.entries) {
          if (entry.activityId === prevActiveId) {
            const cleanup = store.cleanups.get(entryId);
            runSafely(cleanup);
            store.cleanups.delete(entryId);
          }
        }
      }

      // 2. Focus: run effects for new active activity's entries
      if (currentActiveId !== null) {
        for (const [entryId, entry] of store.entries) {
          if (entry.activityId === currentActiveId) {
            const cleanup = runSafely(entry.callbackRef.current);
            store.cleanups.set(entryId, cleanup);
          }
        }
      }
    },
  });
}
