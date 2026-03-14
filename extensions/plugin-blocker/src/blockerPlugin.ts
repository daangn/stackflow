import type {
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  StackflowActions,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";
import { useActivity } from "@stackflow/react";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
} from "react";

export type NavigationAction =
  | Omit<PushedEvent, "id" | "eventDate">
  | Omit<PoppedEvent, "id" | "eventDate">
  | Omit<ReplacedEvent, "id" | "eventDate">
  | Omit<StepPushedEvent, "id" | "eventDate">
  | Omit<StepPoppedEvent, "id" | "eventDate">
  | Omit<StepReplacedEvent, "id" | "eventDate">;

export type BlockedNavigation = {
  action: NavigationAction;
};

type BlockerEntry = {
  id: symbol;
  activityId: string;
  shouldBlock: (action: NavigationAction) => boolean;
  onBlocked: (nav: BlockedNavigation, actions: { proceed: () => void }) => void;
};

type BlockerStore = {
  blockers: Map<symbol, BlockerEntry>;
  actions: StackflowActions | null;
  skipNext: boolean;
  onError: (error: unknown) => void;
};

const BlockerStoreContext = createContext<BlockerStore | null>(null);

function useBlockerStore(): BlockerStore {
  const store = useContext(BlockerStoreContext);
  if (!store) {
    throw new Error(
      "blockerPlugin() must be registered before using useBlocker()",
    );
  }
  return store;
}

function replayAction(store: BlockerStore, action: NavigationAction) {
  const actions = store.actions!;

  store.skipNext = true;
  switch (action.name) {
    case "Pushed": {
      const { name: _, ...params } = action;
      actions.push(params);
      break;
    }
    case "Popped": {
      const { name: _, ...params } = action;
      actions.pop(params);
      break;
    }
    case "Replaced": {
      const { name: _, ...params } = action;
      actions.replace(params);
      break;
    }
    case "StepPushed": {
      const { name: _, ...params } = action;
      actions.stepPush(params);
      break;
    }
    case "StepPopped": {
      const { name: _, ...params } = action;
      actions.stepPop(params);
      break;
    }
    case "StepReplaced": {
      const { name: _, ...params } = action;
      actions.stepReplace(params);
      break;
    }
  }
}

function handleBeforeNavigation(
  store: BlockerStore,
  action: NavigationAction,
  preventDefault: () => void,
) {
  if (store.skipNext) {
    store.skipNext = false;
    return;
  }

  const stack = store.actions!.getStack();
  const activeActivityIds = new Set(
    stack.activities.filter((a) => a.isActive).map((a) => a.id),
  );

  const blockingBlockers: BlockerEntry[] = [];
  for (const blocker of store.blockers.values()) {
    if (
      activeActivityIds.has(blocker.activityId) &&
      blocker.shouldBlock(action)
    ) {
      blockingBlockers.push(blocker);
    }
  }

  if (blockingBlockers.length === 0) {
    return;
  }

  preventDefault();

  const blockingSet = new Set(blockingBlockers.map((b) => b.id));
  const proceededSet = new Set<symbol>();
  let executed = false;

  for (const blocker of blockingBlockers) {
    const proceed = () => {
      proceededSet.add(blocker.id);

      if (proceededSet.size >= blockingSet.size && !executed) {
        executed = true;
        replayAction(store, action);
      }
    };

    try {
      blocker.onBlocked({ action }, { proceed });
    } catch (e) {
      store.onError(e);
    }
  }
}

export function blockerPlugin(options?: {
  onError?: (error: unknown) => void;
}): StackflowReactPlugin {
  const store: BlockerStore = {
    blockers: new Map(),
    actions: null,
    skipNext: false,
    onError: options?.onError ?? console.error,
  };

  return () => ({
    key: "@stackflow/plugin-blocker",

    onInit({ actions }) {
      store.actions = actions;
    },

    wrapStack({ stack }) {
      return createElement(
        BlockerStoreContext.Provider,
        { value: store },
        stack.render(),
      );
    },

    onBeforePush({ actionParams, actions }) {
      handleBeforeNavigation(
        store,
        { name: "Pushed", ...actionParams },
        actions.preventDefault,
      );
    },
    onBeforePop({ actionParams, actions }) {
      handleBeforeNavigation(
        store,
        { name: "Popped", ...actionParams },
        actions.preventDefault,
      );
    },
    onBeforeReplace({ actionParams, actions }) {
      handleBeforeNavigation(
        store,
        { name: "Replaced", ...actionParams },
        actions.preventDefault,
      );
    },
    onBeforeStepPush({ actionParams, actions }) {
      handleBeforeNavigation(
        store,
        { name: "StepPushed", ...actionParams },
        actions.preventDefault,
      );
    },
    onBeforeStepPop({ actionParams, actions }) {
      handleBeforeNavigation(
        store,
        { name: "StepPopped", ...actionParams },
        actions.preventDefault,
      );
    },
    onBeforeStepReplace({ actionParams, actions }) {
      handleBeforeNavigation(
        store,
        { name: "StepReplaced", ...actionParams },
        actions.preventDefault,
      );
    },
  });
}

export function useBlocker(options: {
  shouldBlock: (action: NavigationAction) => boolean;
  onBlocked: (
    blockedNavigation: BlockedNavigation,
    actions: { proceed: () => void },
  ) => void;
}): void {
  const store = useBlockerStore();
  const activity = useActivity();
  const idRef = useRef<symbol>(Symbol());

  useEffect(() => {
    store.blockers.set(idRef.current, {
      id: idRef.current,
      activityId: activity.id,
      shouldBlock: options.shouldBlock,
      onBlocked: options.onBlocked,
    });
  }, [store.blockers, activity.id, options.shouldBlock, options.onBlocked]);

  useEffect(() => {
    return () => {
      store.blockers.delete(idRef.current);
    };
  }, [store.blockers]);
}
