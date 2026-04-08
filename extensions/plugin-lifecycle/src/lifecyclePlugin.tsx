import type { StackflowReactPlugin } from "@stackflow/react";
import { createContext, createElement, useContext } from "react";
import { runSafely } from "./runSafely";

type FocusEffectEntry = {
  id: symbol;
  activityId: string;
  callbackRef: { current: () => (() => void) | void };
};

type PendingTransition = {
  prevActiveId: string | null;
  currentActiveId: string | null;
};

type LifecycleStore = {
  entries: Map<symbol, FocusEffectEntry>;
  cleanups: Map<symbol, (() => void) | void>;
  prevActiveActivityId: string | null;
  processing: boolean;
  pendingTransition: PendingTransition | null;
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

function processTransition(
  store: LifecycleStore,
  prevActiveId: string | null,
  currentActiveId: string | null,
): void {
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
}

export function lifecyclePlugin(): StackflowReactPlugin {
  const store: LifecycleStore = {
    entries: new Map(),
    cleanups: new Map(),
    prevActiveActivityId: null,
    processing: false,
    pendingTransition: null,
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

      // Reentrancy guard: if a callback triggers navigation (push/pop/replace),
      // onChanged fires synchronously again. Defer to avoid corrupted iteration.
      if (store.processing) {
        store.pendingTransition = { prevActiveId, currentActiveId };
        return;
      }

      store.processing = true;
      try {
        processTransition(store, prevActiveId, currentActiveId);

        // Drain queued transitions from reentrant onChanged calls
        while (store.pendingTransition !== null) {
          const pending = store.pendingTransition;
          store.pendingTransition = null;
          processTransition(
            store,
            pending.prevActiveId,
            pending.currentActiveId,
          );
        }
      } finally {
        store.processing = false;
      }
    },
  });
}
